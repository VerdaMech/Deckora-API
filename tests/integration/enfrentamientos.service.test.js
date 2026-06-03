import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ORGANIZADOR_TEST } from '../fixtures/usuarios.fixture.js';
import { crearTransaccionFake } from '../helpers/integration.helper.js';

// ─── Mocks de dependencias del service ───────────────────────────────────────

vi.mock('../../src/modules/enfrentamientos/enfrentamientos.repository.js', () => ({
  buscarPorId: vi.fn(),
  actualizarParticipante: vi.fn(),
  buscarOCrearEstadistica: vi.fn(),
  actualizarEstadistica: vi.fn(),
  actualizarEstado: vi.fn(),
}));

vi.mock('../../src/models/index.js', () => ({
  sequelize: { transaction: vi.fn() },
  Torneo: { findByPk: vi.fn() },
  Ronda: { findByPk: vi.fn() },
}));

const repo = await import('../../src/modules/enfrentamientos/enfrentamientos.repository.js');
const { sequelize, Torneo, Ronda } = await import('../../src/models/index.js');
const service = await import('../../src/modules/enfrentamientos/enfrentamientos.service.js');

let transaccion;

/**
 * Construye un enfrentamiento con la forma que devuelve `repo.buscarPorId`,
 * incluyendo `participantes[].Inscripcion.usuario_id`.
 */
function enfrentamientoMock(overrides = {}) {
  return {
    id: 'enf-1',
    estado: 'pendiente',
    ronda_id: 'ronda-1',
    participantes: [
      { id: 'ep-1', inscripcion_id: 'insc-1', Inscripcion: { usuario_id: 'jug-1' } },
      { id: 'ep-2', inscripcion_id: 'insc-2', Inscripcion: { usuario_id: 'jug-2' } },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  transaccion = crearTransaccionFake();
  sequelize.transaction.mockResolvedValue(transaccion);
  Ronda.findByPk.mockResolvedValue({ id: 'ronda-1', torneo_id: 'torneo-1' });
  Torneo.findByPk.mockResolvedValue({ id: 'torneo-1', organizador_id: ORGANIZADOR_TEST.id });
});

describe('enfrentamientos.service — registrarResultado() @regression', () => {
  it('TC-ENF-001: ganador y derrota reciben 3 y 0 puntos', async () => {
    repo.buscarPorId.mockResolvedValue(enfrentamientoMock());

    await service.registrarResultado(
      'enf-1',
      {
        resultados: [
          { inscripcion_id: 'insc-1', resultado: 'ganador' },
          { inscripcion_id: 'insc-2', resultado: 'derrota' },
        ],
      },
      ORGANIZADOR_TEST.id,
    );

    expect(repo.actualizarParticipante).toHaveBeenCalledWith('ep-1', 'ganador', 3, transaccion);
    // El enum del modelo usa 'perdedor' aunque la API reciba 'derrota'
    expect(repo.actualizarParticipante).toHaveBeenCalledWith('ep-2', 'perdedor', 0, transaccion);
    expect(repo.actualizarEstado).toHaveBeenCalledWith('enf-1', 'finalizado', transaccion);
    expect(transaccion.commit).toHaveBeenCalledOnce();
    expect(transaccion.rollback).not.toHaveBeenCalled();
  });

  it('TC-ENF-002: un empate otorga 1 punto a cada participante', async () => {
    repo.buscarPorId.mockResolvedValue(enfrentamientoMock());

    await service.registrarResultado(
      'enf-1',
      {
        resultados: [
          { inscripcion_id: 'insc-1', resultado: 'empate' },
          { inscripcion_id: 'insc-2', resultado: 'empate' },
        ],
      },
      ORGANIZADOR_TEST.id,
    );

    expect(repo.actualizarParticipante).toHaveBeenCalledWith('ep-1', 'empate', 1, transaccion);
    expect(repo.actualizarParticipante).toHaveBeenCalledWith('ep-2', 'empate', 1, transaccion);
    expect(repo.actualizarEstadistica).toHaveBeenCalledWith('jug-1', 'partidas_empatadas', transaccion);
    expect(transaccion.commit).toHaveBeenCalledOnce();
  });

  it('TC-ENF-003: no puede haber dos ganadores', async () => {
    repo.buscarPorId.mockResolvedValue(enfrentamientoMock());

    await expect(
      service.registrarResultado(
        'enf-1',
        {
          resultados: [
            { inscripcion_id: 'insc-1', resultado: 'ganador' },
            { inscripcion_id: 'insc-2', resultado: 'ganador' },
          ],
        },
        ORGANIZADOR_TEST.id,
      ),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/un ganador/) });
    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(repo.actualizarParticipante).not.toHaveBeenCalled();
  });

  it('TC-ENF-004: no puede haber empate si hay un ganador', async () => {
    repo.buscarPorId.mockResolvedValue(enfrentamientoMock());

    await expect(
      service.registrarResultado(
        'enf-1',
        {
          resultados: [
            { inscripcion_id: 'insc-1', resultado: 'ganador' },
            { inscripcion_id: 'insc-2', resultado: 'empate' },
          ],
        },
        ORGANIZADOR_TEST.id,
      ),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/empates si hay un ganador/) });
  });

  it('TC-ENF-005: un enfrentamiento finalizado no se puede volver a registrar (409)', async () => {
    repo.buscarPorId.mockResolvedValue(enfrentamientoMock({ estado: 'finalizado' }));

    await expect(
      service.registrarResultado(
        'enf-1',
        {
          resultados: [
            { inscripcion_id: 'insc-1', resultado: 'ganador' },
            { inscripcion_id: 'insc-2', resultado: 'derrota' },
          ],
        },
        ORGANIZADOR_TEST.id,
      ),
    ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/ya tiene resultado/) });
  });

  it('TC-ENF-006: solo el organizador del torneo puede registrar resultados (403)', async () => {
    repo.buscarPorId.mockResolvedValue(enfrentamientoMock());
    Torneo.findByPk.mockResolvedValue({ id: 'torneo-1', organizador_id: 'otro-org' });

    await expect(
      service.registrarResultado(
        'enf-1',
        {
          resultados: [
            { inscripcion_id: 'insc-1', resultado: 'ganador' },
            { inscripcion_id: 'insc-2', resultado: 'derrota' },
          ],
        },
        ORGANIZADOR_TEST.id,
      ),
    ).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/No tienes permiso/) });
  });

  it('TC-ENF-007: inscripcion_id que no corresponden al enfrentamiento son rechazados (400)', async () => {
    repo.buscarPorId.mockResolvedValue(enfrentamientoMock());

    await expect(
      service.registrarResultado(
        'enf-1',
        {
          resultados: [
            { inscripcion_id: 'insc-99', resultado: 'ganador' },
            { inscripcion_id: 'insc-98', resultado: 'derrota' },
          ],
        },
        ORGANIZADOR_TEST.id,
      ),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/no corresponden/) });
  });

  it('TC-ENF-008: las estadísticas se actualizan dentro de la transacción', async () => {
    repo.buscarPorId.mockResolvedValue(enfrentamientoMock());

    await service.registrarResultado(
      'enf-1',
      {
        resultados: [
          { inscripcion_id: 'insc-1', resultado: 'ganador' },
          { inscripcion_id: 'insc-2', resultado: 'derrota' },
        ],
      },
      ORGANIZADOR_TEST.id,
    );

    expect(repo.buscarOCrearEstadistica).toHaveBeenCalledWith('jug-1', transaccion);
    expect(repo.buscarOCrearEstadistica).toHaveBeenCalledWith('jug-2', transaccion);
    expect(repo.actualizarEstadistica).toHaveBeenCalledWith('jug-1', 'partidas_ganadas', transaccion);
    expect(repo.actualizarEstadistica).toHaveBeenCalledWith('jug-2', 'partidas_perdidas', transaccion);
    expect(transaccion.commit).toHaveBeenCalledOnce();
  });

  it('TC-ENF-009: Commander — mesa de 3 con 1 ganador y 2 derrotas', async () => {
    repo.buscarPorId.mockResolvedValue(
      enfrentamientoMock({
        participantes: [
          { id: 'ep-1', inscripcion_id: 'insc-1', Inscripcion: { usuario_id: 'jug-1' } },
          { id: 'ep-2', inscripcion_id: 'insc-2', Inscripcion: { usuario_id: 'jug-2' } },
          { id: 'ep-3', inscripcion_id: 'insc-3', Inscripcion: { usuario_id: 'jug-3' } },
        ],
      }),
    );

    await service.registrarResultado(
      'enf-1',
      {
        resultados: [
          { inscripcion_id: 'insc-1', resultado: 'ganador' },
          { inscripcion_id: 'insc-2', resultado: 'derrota' },
          { inscripcion_id: 'insc-3', resultado: 'derrota' },
        ],
      },
      ORGANIZADOR_TEST.id,
    );

    expect(repo.actualizarParticipante).toHaveBeenCalledWith('ep-1', 'ganador', 3, transaccion);
    expect(repo.actualizarParticipante).toHaveBeenCalledWith('ep-2', 'perdedor', 0, transaccion);
    expect(repo.actualizarParticipante).toHaveBeenCalledWith('ep-3', 'perdedor', 0, transaccion);
    expect(transaccion.commit).toHaveBeenCalledOnce();
  });
});
