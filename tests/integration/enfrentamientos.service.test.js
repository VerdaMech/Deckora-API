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

// ═══════════════════════════════════════════════════════════════════════════
// obtenerEnfrentamiento()
// ═══════════════════════════════════════════════════════════════════════════

describe('enfrentamientos.service — obtenerEnfrentamiento()', () => {
  it('TC-ENF-010: devuelve el enfrentamiento cuando existe', async () => {
    const datos = enfrentamientoMock();
    repo.buscarPorId.mockResolvedValue(datos);

    const resultado = await service.obtenerEnfrentamiento('enf-1');

    expect(repo.buscarPorId).toHaveBeenCalledWith('enf-1');
    expect(resultado).toEqual(datos);
  });

  it('TC-ENF-011: lanza 404 cuando el enfrentamiento no existe', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(service.obtenerEnfrentamiento('enf-inexistente'))
      .rejects.toMatchObject({ status: 404, message: expect.stringMatching(/no encontrado/) });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// cambiarEstado()
// ═══════════════════════════════════════════════════════════════════════════

describe('enfrentamientos.service — cambiarEstado()', () => {
  it('TC-ENF-012: el organizador puede cambiar el estado del enfrentamiento', async () => {
    const datos = enfrentamientoMock();
    const datosActualizado = enfrentamientoMock({ estado: 'en_curso' });
    repo.buscarPorId
      .mockResolvedValueOnce(datos)          // primera llamada: validacion
      .mockResolvedValueOnce(datosActualizado); // segunda llamada: retorno final

    const resultado = await service.cambiarEstado('enf-1', { estado: 'en_curso' }, ORGANIZADOR_TEST.id);

    expect(repo.actualizarEstado).toHaveBeenCalledWith('enf-1', 'en_curso', null);
    expect(resultado).toEqual(datosActualizado);
  });

  it('TC-ENF-013: lanza 404 si el enfrentamiento no existe', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(service.cambiarEstado('enf-inexistente', { estado: 'en_curso' }, ORGANIZADOR_TEST.id))
      .rejects.toMatchObject({ status: 404, message: expect.stringMatching(/no encontrado/) });
  });

  it('TC-ENF-014: lanza 403 si el usuario no es el organizador del torneo', async () => {
    repo.buscarPorId.mockResolvedValue(enfrentamientoMock());
    Torneo.findByPk.mockResolvedValue({ id: 'torneo-1', organizador_id: 'otro-org' });

    await expect(service.cambiarEstado('enf-1', { estado: 'en_curso' }, ORGANIZADOR_TEST.id))
      .rejects.toMatchObject({ status: 403, message: expect.stringMatching(/No tienes permiso/) });
  });
});
