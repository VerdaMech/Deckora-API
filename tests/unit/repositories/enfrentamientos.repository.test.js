import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/models/index.js', () => ({
  Enfrentamiento: {
    findByPk: vi.fn(),
    update: vi.fn(),
  },
  EnfrentamientoParticipante: {
    findAll: vi.fn(),
    update: vi.fn(),
  },
  Inscripcion: {},
  Jugador: {},
  Usuario: {},
  Estadistica: {
    increment: vi.fn(),
    findOrCreate: vi.fn(),
  },
}));

const {
  Enfrentamiento,
  EnfrentamientoParticipante,
  Estadistica,
} = await import('../../../src/models/index.js');
const repo = await import('../../../src/modules/enfrentamientos/enfrentamientos.repository.js');

describe('enfrentamientos.repository', () => {
  beforeEach(() => vi.clearAllMocks());

  // --- buscarPorId ---
  it('TC-REPO-ENF-001: buscarPorId llama a Enfrentamiento.findByPk con includes', async () => {
    const fake = { id: 1, estado: 'pendiente', participantes: [] };
    Enfrentamiento.findByPk.mockResolvedValue(fake);

    const result = await repo.buscarPorId(1);

    expect(Enfrentamiento.findByPk).toHaveBeenCalledTimes(1);
    const [id, options] = Enfrentamiento.findByPk.mock.calls[0];
    expect(id).toBe(1);
    expect(options.include).toBeDefined();
    expect(options.include[0].as).toBe('participantes');
    expect(result).toEqual(fake);
  });

  it('TC-REPO-ENF-002: buscarPorId retorna null si no existe', async () => {
    Enfrentamiento.findByPk.mockResolvedValue(null);

    const result = await repo.buscarPorId(999);

    expect(result).toBeNull();
  });

  // --- actualizarEstado ---
  it('TC-REPO-ENF-003: actualizarEstado llama a Enfrentamiento.update con estado y transaction', async () => {
    const txn = { id: 'txn' };
    Enfrentamiento.update.mockResolvedValue([1]);

    const result = await repo.actualizarEstado(1, 'finalizado', txn);

    expect(Enfrentamiento.update).toHaveBeenCalledWith(
      { estado: 'finalizado' },
      { where: { id: 1 }, transaction: txn },
    );
    expect(result).toEqual([1]);
  });

  it('TC-REPO-ENF-004: actualizarEstado funciona sin transaction', async () => {
    Enfrentamiento.update.mockResolvedValue([1]);

    await repo.actualizarEstado(1, 'en_curso', undefined);

    expect(Enfrentamiento.update).toHaveBeenCalledWith(
      { estado: 'en_curso' },
      { where: { id: 1 }, transaction: undefined },
    );
  });

  // --- actualizarParticipante ---
  it('TC-REPO-ENF-005: actualizarParticipante llama a EnfrentamientoParticipante.update', async () => {
    const txn = { id: 'txn' };
    EnfrentamientoParticipante.update.mockResolvedValue([1]);

    const result = await repo.actualizarParticipante(10, 'victoria', 3, txn);

    expect(EnfrentamientoParticipante.update).toHaveBeenCalledWith(
      { resultado: 'victoria', puntos_obtenidos: 3 },
      { where: { id: 10 }, transaction: txn },
    );
    expect(result).toEqual([1]);
  });

  // --- buscarParticipantes ---
  it('TC-REPO-ENF-006: buscarParticipantes llama a EnfrentamientoParticipante.findAll', async () => {
    const fakes = [
      { id: 1, enfrentamiento_id: 5, inscripcion_id: 10 },
      { id: 2, enfrentamiento_id: 5, inscripcion_id: 11 },
    ];
    EnfrentamientoParticipante.findAll.mockResolvedValue(fakes);

    const result = await repo.buscarParticipantes(5);

    expect(EnfrentamientoParticipante.findAll).toHaveBeenCalledTimes(1);
    const call = EnfrentamientoParticipante.findAll.mock.calls[0][0];
    expect(call.where).toEqual({ enfrentamiento_id: 5 });
    expect(call.include).toBeDefined();
    expect(result).toEqual(fakes);
  });

  it('TC-REPO-ENF-007: buscarParticipantes retorna array vacio si no hay participantes', async () => {
    EnfrentamientoParticipante.findAll.mockResolvedValue([]);

    const result = await repo.buscarParticipantes(999);

    expect(result).toEqual([]);
  });

  // --- actualizarEstadistica ---
  it('TC-REPO-ENF-008: actualizarEstadistica llama a Estadistica.increment con campo y transaction', async () => {
    const txn = { id: 'txn' };
    Estadistica.increment.mockResolvedValue([{}, 1]);

    const result = await repo.actualizarEstadistica(10, 'partidas_ganadas', txn);

    expect(Estadistica.increment).toHaveBeenCalledWith('partidas_ganadas', {
      where: { usuario_id: 10 },
      transaction: txn,
    });
  });

  it('TC-REPO-ENF-009: actualizarEstadistica acepta diferentes campos', async () => {
    const txn = { id: 'txn' };
    Estadistica.increment.mockResolvedValue([{}, 1]);

    await repo.actualizarEstadistica(10, 'partidas_perdidas', txn);

    expect(Estadistica.increment).toHaveBeenCalledWith('partidas_perdidas', {
      where: { usuario_id: 10 },
      transaction: txn,
    });
  });

  // --- buscarOCrearEstadistica ---
  it('TC-REPO-ENF-010: buscarOCrearEstadistica llama a Estadistica.findOrCreate', async () => {
    const txn = { id: 'txn' };
    const fake = [{ usuario_id: 5, partidas_ganadas: 0 }, true];
    Estadistica.findOrCreate.mockResolvedValue(fake);

    const result = await repo.buscarOCrearEstadistica(5, txn);

    expect(Estadistica.findOrCreate).toHaveBeenCalledTimes(1);
    const call = Estadistica.findOrCreate.mock.calls[0][0];
    expect(call.where).toEqual({ usuario_id: 5 });
    expect(call.defaults.usuario_id).toBe(5);
    expect(call.defaults.partidas_ganadas).toBe(0);
    expect(call.defaults.partidas_perdidas).toBe(0);
    expect(call.defaults.partidas_empatadas).toBe(0);
    expect(call.defaults.torneos_participados).toBe(0);
    expect(call.transaction).toBe(txn);
    expect(result).toEqual(fake);
  });

  it('TC-REPO-ENF-011: buscarOCrearEstadistica retorna existente si ya existe', async () => {
    const txn = { id: 'txn' };
    const existing = [{ usuario_id: 5, partidas_ganadas: 10 }, false];
    Estadistica.findOrCreate.mockResolvedValue(existing);

    const result = await repo.buscarOCrearEstadistica(5, txn);

    expect(result[1]).toBe(false);
    expect(result[0].partidas_ganadas).toBe(10);
  });
});
