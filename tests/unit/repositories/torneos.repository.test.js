import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/models/index.js', () => ({
  Torneo: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    sequelize: { fn: vi.fn(), col: vi.fn() },
  },
  Inscripcion: {
    create: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  },
  SnapshotMazoInscripcion: {
    create: vi.fn(),
    findAll: vi.fn(),
  },
  Carta: {},
  Jugador: {},
  Mazo: {},
  Usuario: { findByPk: vi.fn() },
  Ronda: { findAll: vi.fn() },
  Enfrentamiento: { count: vi.fn() },
  EnfrentamientoParticipante: {},
  Estadistica: {
    findOrCreate: vi.fn(),
    increment: vi.fn(),
  },
}));

const {
  Torneo,
  Inscripcion,
  SnapshotMazoInscripcion,
  Ronda,
  Enfrentamiento,
  Estadistica,
  Usuario,
} = await import('../../../src/models/index.js');
const repo = await import('../../../src/modules/torneos/torneos.repository.js');

describe('torneos.repository', () => {
  beforeEach(() => vi.clearAllMocks());

  // --- listar ---
  it('TC-REPO-TOR-001: listar llama a Torneo.findAll con filtros por defecto', async () => {
    const fakes = [{ id: 1, nombre: 'Torneo A' }];
    Torneo.findAll.mockResolvedValue(fakes);

    const result = await repo.listar();

    expect(Torneo.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakes);
  });

  it('TC-REPO-TOR-002: listar con organizadorId filtra por organizador', async () => {
    Torneo.findAll.mockResolvedValue([]);

    await repo.listar({ organizadorId: 5 });

    const call = Torneo.findAll.mock.calls[0][0];
    expect(call.where.organizador_id).toBe(5);
  });

  it('TC-REPO-TOR-003: listar con formato filtra por formato', async () => {
    Torneo.findAll.mockResolvedValue([]);

    await repo.listar({ formato: 'standard' });

    const call = Torneo.findAll.mock.calls[0][0];
    expect(call.where.formato).toBe('standard');
  });

  // --- crear ---
  it('TC-REPO-TOR-004: crear llama a Torneo.create', async () => {
    const datos = { nombre: 'Torneo X', formato: 'modern' };
    const fake = { id: 1, ...datos };
    Torneo.create.mockResolvedValue(fake);

    const result = await repo.crear(datos);

    expect(Torneo.create).toHaveBeenCalledWith(datos);
    expect(result).toEqual(fake);
  });

  // --- buscarPorId ---
  it('TC-REPO-TOR-005: buscarPorId llama a Torneo.findByPk con includes', async () => {
    const fake = { id: 3, nombre: 'Torneo Z' };
    Torneo.findByPk.mockResolvedValue(fake);

    const result = await repo.buscarPorId(3);

    expect(Torneo.findByPk).toHaveBeenCalledTimes(1);
    const [id, options] = Torneo.findByPk.mock.calls[0];
    expect(id).toBe(3);
    expect(options.include).toBeDefined();
    expect(result).toEqual(fake);
  });

  // --- actualizar ---
  it('TC-REPO-TOR-006: actualizar llama a Torneo.update y retorna el torneo actualizado', async () => {
    Torneo.update.mockResolvedValue([1]);
    const fake = { id: 1, nombre: 'Actualizado' };
    Torneo.findByPk.mockResolvedValue(fake);

    const result = await repo.actualizar(1, { nombre: 'Actualizado' });

    expect(Torneo.update).toHaveBeenCalledWith({ nombre: 'Actualizado' }, { where: { id: 1 } });
    expect(Torneo.findByPk).toHaveBeenCalledWith(1);
    expect(result).toEqual(fake);
  });

  it('TC-REPO-TOR-007: actualizar retorna null si no se afectan filas', async () => {
    Torneo.update.mockResolvedValue([0]);

    const result = await repo.actualizar(999, { nombre: 'No existe' });

    expect(result).toBeNull();
    expect(Torneo.findByPk).not.toHaveBeenCalled();
  });

  // --- crearInscripcion ---
  it('TC-REPO-TOR-008: crearInscripcion llama a Inscripcion.create', async () => {
    const datos = { torneo_id: 1, usuario_id: 2, mazo_id: 3 };
    const fake = { id: 10, ...datos };
    Inscripcion.create.mockResolvedValue(fake);

    const result = await repo.crearInscripcion(datos);

    expect(Inscripcion.create).toHaveBeenCalledWith(datos);
    expect(result).toEqual(fake);
  });

  // --- buscarInscripcion ---
  it('TC-REPO-TOR-009: buscarInscripcion llama a Inscripcion.findOne con torneo y jugador', async () => {
    const fake = { id: 1, torneo_id: 5, usuario_id: 10 };
    Inscripcion.findOne.mockResolvedValue(fake);

    const result = await repo.buscarInscripcion(5, 10);

    expect(Inscripcion.findOne).toHaveBeenCalledWith({
      where: { torneo_id: 5, usuario_id: 10 },
    });
    expect(result).toEqual(fake);
  });

  it('TC-REPO-TOR-010: buscarInscripcion retorna null si no existe', async () => {
    Inscripcion.findOne.mockResolvedValue(null);

    const result = await repo.buscarInscripcion(1, 999);

    expect(result).toBeNull();
  });

  // --- contarInscripcionesConfirmadas ---
  it('TC-REPO-TOR-011: contarInscripcionesConfirmadas llama a Inscripcion.count', async () => {
    Inscripcion.count.mockResolvedValue(8);

    const result = await repo.contarInscripcionesConfirmadas(1);

    expect(Inscripcion.count).toHaveBeenCalledWith({
      where: { torneo_id: 1, confirmado: true },
    });
    expect(result).toBe(8);
  });

  // --- cerrarTorneo ---
  it('TC-REPO-TOR-012: cerrarTorneo llama a Torneo.update con estado finalizado', async () => {
    const txn = { id: 'fake-txn' };
    Torneo.update.mockResolvedValue([1]);

    await repo.cerrarTorneo(5, txn);

    expect(Torneo.update).toHaveBeenCalledWith(
      { estado: 'finalizado' },
      { where: { id: 5 }, transaction: txn },
    );
  });

  // --- verificarEnfrentamientosPendientes ---
  it('TC-REPO-TOR-013: verificarEnfrentamientosPendientes retorna 0 si no hay rondas', async () => {
    Ronda.findAll.mockResolvedValue([]);

    const result = await repo.verificarEnfrentamientosPendientes(1);

    expect(result).toBe(0);
    expect(Enfrentamiento.count).not.toHaveBeenCalled();
  });

  it('TC-REPO-TOR-014: verificarEnfrentamientosPendientes cuenta enfrentamientos no finalizados', async () => {
    Ronda.findAll.mockResolvedValue([{ id: 10 }, { id: 11 }]);
    Enfrentamiento.count.mockResolvedValue(3);

    const result = await repo.verificarEnfrentamientosPendientes(1);

    expect(Enfrentamiento.count).toHaveBeenCalledTimes(1);
    const call = Enfrentamiento.count.mock.calls[0][0];
    expect(call.where.ronda_id).toBeDefined();
    expect(result).toBe(3);
  });

  // --- crearSnapshot ---
  it('TC-REPO-TOR-015: crearSnapshot llama a SnapshotMazoInscripcion.create', async () => {
    const datos = { inscripcion_id: 1, carta_id: 5, cantidad: 2 };
    SnapshotMazoInscripcion.create.mockResolvedValue(datos);

    const result = await repo.crearSnapshot(datos);

    expect(SnapshotMazoInscripcion.create).toHaveBeenCalledWith(datos);
    expect(result).toEqual(datos);
  });

  // --- buscarOCrearEstadistica ---
  it('TC-REPO-TOR-016: buscarOCrearEstadistica llama a Estadistica.findOrCreate', async () => {
    const txn = { id: 'txn' };
    const fake = [{ usuario_id: 1, partidas_ganadas: 0 }, true];
    Estadistica.findOrCreate.mockResolvedValue(fake);

    const result = await repo.buscarOCrearEstadistica(1, txn);

    expect(Estadistica.findOrCreate).toHaveBeenCalledTimes(1);
    const call = Estadistica.findOrCreate.mock.calls[0][0];
    expect(call.where).toEqual({ usuario_id: 1 });
    expect(call.transaction).toBe(txn);
    expect(result).toEqual(fake);
  });

  // --- buscarUsuarioPorId ---
  it('TC-REPO-TOR-017: buscarUsuarioPorId llama a Usuario.findByPk', async () => {
    const fake = { id: 1, correo: 'test@test.com', nombre_usuario: 'tester' };
    Usuario.findByPk.mockResolvedValue(fake);

    const result = await repo.buscarUsuarioPorId(1);

    expect(Usuario.findByPk).toHaveBeenCalledWith(1, {
      attributes: ['id', 'correo', 'nombre_usuario'],
    });
    expect(result).toEqual(fake);
  });

  // --- listarInscripciones ---
  it('TC-REPO-TOR-018: listarInscripciones llama a Inscripcion.findAll con torneo_id e includes', async () => {
    const fakes = [{ id: 1, torneo_id: 5, usuario_id: 2 }];
    Inscripcion.findAll.mockResolvedValue(fakes);

    const result = await repo.listarInscripciones(5);

    expect(Inscripcion.findAll).toHaveBeenCalledTimes(1);
    const call = Inscripcion.findAll.mock.calls[0][0];
    expect(call.where).toEqual({ torneo_id: 5 });
    expect(call.include).toBeDefined();
    expect(result).toEqual(fakes);
  });

  // --- buscarInscripcionPorId ---
  it('TC-REPO-TOR-019: buscarInscripcionPorId llama a Inscripcion.findByPk', async () => {
    const fake = { id: 10, torneo_id: 1, usuario_id: 3 };
    Inscripcion.findByPk.mockResolvedValue(fake);

    const result = await repo.buscarInscripcionPorId(10);

    expect(Inscripcion.findByPk).toHaveBeenCalledWith(10);
    expect(result).toEqual(fake);
  });

  it('TC-REPO-TOR-020: buscarInscripcionPorId retorna null si no existe', async () => {
    Inscripcion.findByPk.mockResolvedValue(null);

    const result = await repo.buscarInscripcionPorId(999);

    expect(result).toBeNull();
  });

  // --- eliminarInscripcion ---
  it('TC-REPO-TOR-021: eliminarInscripcion llama a Inscripcion.destroy con where id', async () => {
    Inscripcion.destroy.mockResolvedValue(1);

    const result = await repo.eliminarInscripcion(10);

    expect(Inscripcion.destroy).toHaveBeenCalledWith({ where: { id: 10 } });
    expect(result).toBe(1);
  });

  // --- listarInscripcionesPendientes ---
  it('TC-REPO-TOR-022: listarInscripcionesPendientes filtra por confirmado false e incluye modelos', async () => {
    const fakes = [{ id: 2, confirmado: false }];
    Inscripcion.findAll.mockResolvedValue(fakes);

    const result = await repo.listarInscripcionesPendientes(3);

    expect(Inscripcion.findAll).toHaveBeenCalledTimes(1);
    const call = Inscripcion.findAll.mock.calls[0][0];
    expect(call.where).toEqual({ torneo_id: 3, confirmado: false });
    expect(call.include).toBeDefined();
    expect(call.include.length).toBeGreaterThanOrEqual(2);
    expect(result).toEqual(fakes);
  });

  // --- aprobarInscripcion ---
  it('TC-REPO-TOR-023: aprobarInscripcion actualiza confirmado a true y retorna inscripcion', async () => {
    Inscripcion.update.mockResolvedValue([1]);
    const fake = { id: 7, confirmado: true };
    Inscripcion.findByPk.mockResolvedValue(fake);

    const result = await repo.aprobarInscripcion(7);

    expect(Inscripcion.update).toHaveBeenCalledWith(
      { confirmado: true },
      { where: { id: 7 } },
    );
    expect(Inscripcion.findByPk).toHaveBeenCalledWith(7);
    expect(result).toEqual(fake);
  });

  // --- obtenerTablaPosiciones ---
  it('TC-REPO-TOR-024: obtenerTablaPosiciones llama a Inscripcion.findAll con includes complejos', async () => {
    const fakes = [{ id: 1, usuario_id: 2 }];
    Inscripcion.findAll.mockResolvedValue(fakes);

    const result = await repo.obtenerTablaPosiciones(4);

    expect(Inscripcion.findAll).toHaveBeenCalledTimes(1);
    const call = Inscripcion.findAll.mock.calls[0][0];
    expect(call.where).toEqual({ torneo_id: 4 });
    expect(call.include).toBeDefined();
    expect(result).toEqual(fakes);
  });

  // --- obtenerJugadoresInscritos ---
  it('TC-REPO-TOR-025: obtenerJugadoresInscritos retorna array de usuario_ids confirmados', async () => {
    const fakes = [{ usuario_id: 10 }, { usuario_id: 20 }, { usuario_id: 30 }];
    Inscripcion.findAll.mockResolvedValue(fakes);

    const result = await repo.obtenerJugadoresInscritos(2);

    expect(Inscripcion.findAll).toHaveBeenCalledTimes(1);
    const call = Inscripcion.findAll.mock.calls[0][0];
    expect(call.where).toEqual({ torneo_id: 2, confirmado: true });
    expect(call.attributes).toEqual(['usuario_id']);
    expect(result).toEqual([10, 20, 30]);
  });

  // --- obtenerSnapshotInscripcion ---
  it('TC-REPO-TOR-026: obtenerSnapshotInscripcion llama a SnapshotMazoInscripcion.findAll con include Carta', async () => {
    const fakes = [{ carta_id: 1, cantidad: 4 }, { carta_id: 2, cantidad: 2 }];
    SnapshotMazoInscripcion.findAll.mockResolvedValue(fakes);

    const result = await repo.obtenerSnapshotInscripcion(15);

    expect(SnapshotMazoInscripcion.findAll).toHaveBeenCalledTimes(1);
    const call = SnapshotMazoInscripcion.findAll.mock.calls[0][0];
    expect(call.where).toEqual({ inscripcion_id: 15 });
    expect(call.include).toBeDefined();
    expect(result).toEqual(fakes);
  });
});
