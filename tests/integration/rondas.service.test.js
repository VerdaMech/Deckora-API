import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JUGADOR_TEST, ORGANIZADOR_TEST } from '../fixtures/usuarios.fixture.js';

// ─── Mocks de dependencias del service ───────────────────────────────────────
// rondas.service.js usa AMBOS: repositorio + modelos directos.
// Los emparejadores NO se mockean (integración real).

vi.mock('../../src/modules/rondas/rondas.repository.js', () => ({
  crear: vi.fn(),
  listarPorTorneo: vi.fn(),
  buscarPorId: vi.fn(),
  eliminarRonda: vi.fn(),
  contarRondasDeTorneo: vi.fn(),
  contarEnfrentamientosPendientesDeTorneo: vi.fn(),
  obtenerInscripcionesConPuntos: vi.fn(),
}));

vi.mock('../../src/models/index.js', () => ({
  Torneo: { findByPk: vi.fn() },
  Enfrentamiento: { create: vi.fn() },
  EnfrentamientoParticipante: { create: vi.fn() },
  Inscripcion: { findAll: vi.fn() },
  Jugador: {},
  Usuario: {},
  Mazo: {},
}));

const repo = await import('../../src/modules/rondas/rondas.repository.js');
const { Torneo, Enfrentamiento, EnfrentamientoParticipante, Inscripcion } =
  await import('../../src/models/index.js');
const service = await import('../../src/modules/rondas/rondas.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('rondas.service — crearRonda', () => {
  it('TC-RND-001: torneo no encontrado devuelve 404', async () => {
    Torneo.findByPk.mockResolvedValue(null);

    await expect(
      service.crearRonda('torneo-x', { tipo_ronda: 'swiss', asignaciones: [] }, ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({
      status: 404,
      message: 'Torneo no encontrado',
    });
  });

  it('TC-RND-002: usuario no organizador del torneo devuelve 403', async () => {
    Torneo.findByPk.mockResolvedValue({
      id: 'torneo-1',
      organizador_id: 'otro-usuario',
      formato: 'STANDARD',
    });

    await expect(
      service.crearRonda('torneo-1', { tipo_ronda: 'swiss', asignaciones: [] }, ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it('TC-RND-003: enfrentamientos pendientes devuelve 400', async () => {
    Torneo.findByPk.mockResolvedValue({
      id: 'torneo-1',
      organizador_id: ORGANIZADOR_TEST.id,
      formato: 'STANDARD',
    });
    repo.contarEnfrentamientosPendientesDeTorneo.mockResolvedValue(2);

    await expect(
      service.crearRonda('torneo-1', { tipo_ronda: 'swiss', asignaciones: [] }, ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('enfrentamientos sin finalizar'),
    });
  });

  it('TC-RND-004: inscripciones insuficientes devuelve 400', async () => {
    Torneo.findByPk.mockResolvedValue({
      id: 'torneo-1',
      organizador_id: ORGANIZADOR_TEST.id,
      formato: 'STANDARD',
    });
    repo.contarEnfrentamientosPendientesDeTorneo.mockResolvedValue(0);
    repo.obtenerInscripcionesConPuntos.mockResolvedValue([
      { id: 'ins-1', jugador_id: 'j1', puntos_acumulados: 0 },
    ]);

    await expect(
      service.crearRonda('torneo-1', { tipo_ronda: 'swiss', asignaciones: [] }, ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('al menos 2'),
    });
  });

  it('TC-RND-005: inscripciones insuficientes para COMMANDER (< 3) devuelve 400', async () => {
    Torneo.findByPk.mockResolvedValue({
      id: 'torneo-1',
      organizador_id: ORGANIZADOR_TEST.id,
      formato: 'COMMANDER',
    });
    repo.contarEnfrentamientosPendientesDeTorneo.mockResolvedValue(0);
    repo.obtenerInscripcionesConPuntos.mockResolvedValue([
      { id: 'ins-1', jugador_id: 'j1', puntos_acumulados: 0 },
      { id: 'ins-2', jugador_id: 'j2', puntos_acumulados: 0 },
    ]);

    await expect(
      service.crearRonda('torneo-1', { tipo_ronda: 'swiss', asignaciones: [] }, ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('al menos 3'),
    });
  });

  it('TC-RND-006: crea ronda swiss 1v1 exitosamente con 4 jugadores', async () => {
    const torneoId = 'torneo-1';
    const inscripciones = [
      { id: 'ins-1', jugador_id: 'j1', puntos_acumulados: 6 },
      { id: 'ins-2', jugador_id: 'j2', puntos_acumulados: 3 },
      { id: 'ins-3', jugador_id: 'j3', puntos_acumulados: 9 },
      { id: 'ins-4', jugador_id: 'j4', puntos_acumulados: 0 },
    ];

    Torneo.findByPk.mockResolvedValue({
      id: torneoId,
      organizador_id: ORGANIZADOR_TEST.id,
      formato: 'STANDARD',
    });
    repo.contarEnfrentamientosPendientesDeTorneo.mockResolvedValue(0);
    repo.obtenerInscripcionesConPuntos.mockResolvedValue(inscripciones);
    repo.contarRondasDeTorneo.mockResolvedValue(0);
    repo.crear.mockResolvedValue({ id: 'ronda-1' });

    // Enfrentamiento.create devuelve objetos con id
    let enfCounter = 0;
    Enfrentamiento.create.mockImplementation(() =>
      Promise.resolve({ id: `enf-${++enfCounter}` }),
    );
    EnfrentamientoParticipante.create.mockResolvedValue({});

    // buscarPorId para serializarRonda: devolver ronda sin participantes con inscripcion_id
    repo.buscarPorId.mockResolvedValue({
      toJSON: () => ({
        id: 'ronda-1',
        torneo_id: torneoId,
        tipo_ronda: 'swiss',
        numero_ronda: 1,
        enfrentamientos: [],
      }),
    });
    // Inscripcion.findAll para serializarRonda (no hay inscripcionIds -> no se llama)
    Inscripcion.findAll.mockResolvedValue([]);

    const res = await service.crearRonda(
      torneoId,
      { tipo_ronda: 'swiss', asignaciones: [] },
      ORGANIZADOR_TEST.id,
    );

    expect(repo.crear).toHaveBeenCalledWith(torneoId, 'swiss', 1);
    // Swiss 1v1 con 4 jugadores -> 2 mesas
    expect(Enfrentamiento.create).toHaveBeenCalledTimes(2);
    // 2 participantes por mesa -> 4 llamadas
    expect(EnfrentamientoParticipante.create).toHaveBeenCalledTimes(4);
    expect(res.id).toBe('ronda-1');
  });
});

describe('rondas.service — listarRondasDeTorneo', () => {
  it('TC-RND-007: devuelve rondas serializadas', async () => {
    repo.listarPorTorneo.mockResolvedValue([
      {
        toJSON: () => ({
          id: 'ronda-1',
          torneo_id: 'torneo-1',
          tipo_ronda: 'swiss',
          numero_ronda: 1,
          enfrentamientos: [],
        }),
      },
    ]);
    Inscripcion.findAll.mockResolvedValue([]);

    const res = await service.listarRondasDeTorneo('torneo-1');

    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('ronda-1');
    expect(repo.listarPorTorneo).toHaveBeenCalledWith('torneo-1');
  });
});

describe('rondas.service — obtenerRonda', () => {
  it('TC-RND-008: ronda no encontrada devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(service.obtenerRonda('ronda-x')).rejects.toMatchObject({
      status: 404,
      message: 'Ronda no encontrada',
    });
  });

  it('TC-RND-009: devuelve ronda serializada con participantes', async () => {
    repo.buscarPorId.mockResolvedValue({
      toJSON: () => ({
        id: 'ronda-1',
        torneo_id: 'torneo-1',
        tipo_ronda: 'swiss',
        numero_ronda: 1,
        enfrentamientos: [
          {
            id: 'enf-1',
            numero_mesa: 1,
            estado: 'pendiente',
            participantes: [
              { id: 'ep-1', inscripcion_id: 'ins-1', resultado: null, puntos_obtenidos: 0 },
              { id: 'ep-2', inscripcion_id: 'ins-2', resultado: null, puntos_obtenidos: 0 },
            ],
          },
        ],
      }),
    });
    Inscripcion.findAll.mockResolvedValue([
      {
        toJSON: () => ({
          id: 'ins-1',
          Jugador: { Usuario: { nombre_usuario: 'player1' } },
          Mazo: { nombre: 'Dragon Deck', comandante: 'Ur-Dragon' },
        }),
      },
      {
        toJSON: () => ({
          id: 'ins-2',
          Jugador: { Usuario: { nombre_usuario: 'player2' } },
          Mazo: null,
        }),
      },
    ]);

    const res = await service.obtenerRonda('ronda-1');

    expect(res.enfrentamientos).toHaveLength(1);
    const participantes = res.enfrentamientos[0].participantes;
    expect(participantes).toHaveLength(2);
    expect(participantes[0].nombre_usuario).toBe('player1');
    expect(participantes[0].mazo).toEqual({ nombre: 'Dragon Deck', comandante: 'Ur-Dragon' });
    expect(participantes[1].nombre_usuario).toBe('player2');
    expect(participantes[1].mazo).toBeNull();
  });
});

describe('rondas.service — eliminarRonda', () => {
  it('TC-RND-010: torneo no encontrado devuelve 404', async () => {
    Torneo.findByPk.mockResolvedValue(null);

    await expect(
      service.eliminarRonda('torneo-x', 'ronda-1', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-RND-011: usuario no propietario devuelve 403', async () => {
    Torneo.findByPk.mockResolvedValue({
      id: 'torneo-1',
      organizador_id: 'otro-usuario',
    });

    await expect(
      service.eliminarRonda('torneo-1', 'ronda-1', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('TC-RND-012: ronda no encontrada devuelve 404', async () => {
    Torneo.findByPk.mockResolvedValue({
      id: 'torneo-1',
      organizador_id: ORGANIZADOR_TEST.id,
    });
    repo.buscarPorId.mockResolvedValue(null);

    await expect(
      service.eliminarRonda('torneo-1', 'ronda-x', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-RND-013: ronda no pertenece al torneo devuelve 400', async () => {
    Torneo.findByPk.mockResolvedValue({
      id: 'torneo-1',
      organizador_id: ORGANIZADOR_TEST.id,
    });
    repo.buscarPorId.mockResolvedValue({
      id: 'ronda-1',
      torneo_id: 'torneo-otro',
      enfrentamientos: [],
    });

    await expect(
      service.eliminarRonda('torneo-1', 'ronda-1', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('TC-RND-014: ronda con enfrentamiento finalizado devuelve 400', async () => {
    Torneo.findByPk.mockResolvedValue({
      id: 'torneo-1',
      organizador_id: ORGANIZADOR_TEST.id,
    });
    repo.buscarPorId.mockResolvedValue({
      id: 'ronda-1',
      torneo_id: 'torneo-1',
      enfrentamientos: [{ id: 'enf-1', estado: 'finalizado' }],
    });

    await expect(
      service.eliminarRonda('torneo-1', 'ronda-1', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('finalizados'),
    });
  });

  it('TC-RND-015: elimina ronda pendiente exitosamente', async () => {
    Torneo.findByPk.mockResolvedValue({
      id: 'torneo-1',
      organizador_id: ORGANIZADOR_TEST.id,
    });
    repo.buscarPorId.mockResolvedValue({
      id: 'ronda-1',
      torneo_id: 'torneo-1',
      enfrentamientos: [{ id: 'enf-1', estado: 'pendiente' }],
    });
    repo.eliminarRonda.mockResolvedValue(undefined);

    await service.eliminarRonda('torneo-1', 'ronda-1', ORGANIZADOR_TEST.id);

    expect(repo.eliminarRonda).toHaveBeenCalledWith('ronda-1');
  });
});
