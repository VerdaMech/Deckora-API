import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/models/index.js', () => ({
  sequelize: {
    fn: vi.fn(),
    col: vi.fn(),
  },
  Ronda: {
    create: vi.fn(),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    destroy: vi.fn(),
    count: vi.fn(),
  },
  Enfrentamiento: {
    findAll: vi.fn(),
    destroy: vi.fn(),
    count: vi.fn(),
  },
  EnfrentamientoParticipante: {
    findAll: vi.fn(),
    destroy: vi.fn(),
  },
  Inscripcion: {
    findAll: vi.fn(),
  },
  Jugador: {},
  Usuario: {},
  Mazo: {},
}));

const {
  Ronda,
  Enfrentamiento,
  EnfrentamientoParticipante,
  Inscripcion,
} = await import('../../../src/models/index.js');
const repo = await import('../../../src/modules/rondas/rondas.repository.js');

describe('rondas.repository', () => {
  beforeEach(() => vi.clearAllMocks());

  // --- crear ---
  it('TC-REPO-RON-001: crear llama a Ronda.create con torneo, tipo y numero', async () => {
    const fake = { id: 1, torneo_id: 5, tipo_ronda: 'suizo', numero_ronda: 1 };
    Ronda.create.mockResolvedValue(fake);

    const result = await repo.crear(5, 'suizo', 1);

    expect(Ronda.create).toHaveBeenCalledWith({
      torneo_id: 5,
      tipo_ronda: 'suizo',
      numero_ronda: 1,
    });
    expect(result).toEqual(fake);
  });

  // --- listarPorTorneo ---
  it('TC-REPO-RON-002: listarPorTorneo llama a Ronda.findAll con includes y order', async () => {
    const fakes = [{ id: 1, numero_ronda: 1 }];
    Ronda.findAll.mockResolvedValue(fakes);

    const result = await repo.listarPorTorneo(5);

    expect(Ronda.findAll).toHaveBeenCalledTimes(1);
    const call = Ronda.findAll.mock.calls[0][0];
    expect(call.where).toEqual({ torneo_id: 5 });
    expect(call.include).toBeDefined();
    expect(call.order).toBeDefined();
    expect(result).toEqual(fakes);
  });

  // --- buscarPorId ---
  it('TC-REPO-RON-003: buscarPorId llama a Ronda.findByPk con includes', async () => {
    const fake = { id: 10, torneo_id: 5 };
    Ronda.findByPk.mockResolvedValue(fake);

    const result = await repo.buscarPorId(10);

    expect(Ronda.findByPk).toHaveBeenCalledTimes(1);
    const [id, options] = Ronda.findByPk.mock.calls[0];
    expect(id).toBe(10);
    expect(options.include).toBeDefined();
    expect(result).toEqual(fake);
  });

  it('TC-REPO-RON-004: buscarPorId retorna null si no existe', async () => {
    Ronda.findByPk.mockResolvedValue(null);

    const result = await repo.buscarPorId(999);

    expect(result).toBeNull();
  });

  // --- eliminarRonda ---
  it('TC-REPO-RON-005: eliminarRonda elimina participantes, enfrentamientos y ronda', async () => {
    const enfFakes = [{ id: 100 }, { id: 101 }];
    Enfrentamiento.findAll.mockResolvedValue(enfFakes);
    EnfrentamientoParticipante.destroy.mockResolvedValue(1);
    Enfrentamiento.destroy.mockResolvedValue(2);
    Ronda.destroy.mockResolvedValue(1);

    await repo.eliminarRonda(10);

    expect(Enfrentamiento.findAll).toHaveBeenCalledWith({ where: { ronda_id: 10 } });
    expect(EnfrentamientoParticipante.destroy).toHaveBeenCalledTimes(2);
    expect(EnfrentamientoParticipante.destroy).toHaveBeenCalledWith({ where: { enfrentamiento_id: 100 } });
    expect(EnfrentamientoParticipante.destroy).toHaveBeenCalledWith({ where: { enfrentamiento_id: 101 } });
    expect(Enfrentamiento.destroy).toHaveBeenCalledWith({ where: { ronda_id: 10 } });
    expect(Ronda.destroy).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  it('TC-REPO-RON-006: eliminarRonda funciona si no hay enfrentamientos', async () => {
    Enfrentamiento.findAll.mockResolvedValue([]);
    Enfrentamiento.destroy.mockResolvedValue(0);
    Ronda.destroy.mockResolvedValue(1);

    await repo.eliminarRonda(10);

    expect(EnfrentamientoParticipante.destroy).not.toHaveBeenCalled();
    expect(Enfrentamiento.destroy).toHaveBeenCalledWith({ where: { ronda_id: 10 } });
    expect(Ronda.destroy).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  // --- obtenerInscripcionesConPuntos ---
  it('TC-REPO-RON-007: obtenerInscripcionesConPuntos retorna inscripciones con puntos acumulados', async () => {
    Inscripcion.findAll.mockResolvedValue([
      { id: 1, usuario_id: 10 },
      { id: 2, usuario_id: 20 },
    ]);
    EnfrentamientoParticipante.findAll
      .mockResolvedValueOnce([{ total_puntos: '9' }])
      .mockResolvedValueOnce([{ total_puntos: '6' }]);

    const result = await repo.obtenerInscripcionesConPuntos(5);

    expect(Inscripcion.findAll).toHaveBeenCalledWith({
      where: { torneo_id: 5, confirmado: true },
    });
    expect(EnfrentamientoParticipante.findAll).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { id: 1, jugador_id: 10, puntos_acumulados: 9 },
      { id: 2, jugador_id: 20, puntos_acumulados: 6 },
    ]);
  });

  it('TC-REPO-RON-008: obtenerInscripcionesConPuntos maneja puntos null como 0', async () => {
    Inscripcion.findAll.mockResolvedValue([{ id: 1, usuario_id: 10 }]);
    EnfrentamientoParticipante.findAll.mockResolvedValue([{ total_puntos: null }]);

    const result = await repo.obtenerInscripcionesConPuntos(5);

    expect(result).toEqual([{ id: 1, jugador_id: 10, puntos_acumulados: 0 }]);
  });

  // --- contarRondasDeTorneo ---
  it('TC-REPO-RON-009: contarRondasDeTorneo llama a Ronda.count', async () => {
    Ronda.count.mockResolvedValue(3);

    const result = await repo.contarRondasDeTorneo(5);

    expect(Ronda.count).toHaveBeenCalledWith({ where: { torneo_id: 5 } });
    expect(result).toBe(3);
  });

  // --- contarEnfrentamientosPendientesDeTorneo ---
  it('TC-REPO-RON-010: contarEnfrentamientosPendientesDeTorneo retorna 0 si no hay rondas', async () => {
    Ronda.findAll.mockResolvedValue([]);

    const result = await repo.contarEnfrentamientosPendientesDeTorneo(1);

    expect(result).toBe(0);
    expect(Enfrentamiento.count).not.toHaveBeenCalled();
  });

  it('TC-REPO-RON-011: contarEnfrentamientosPendientesDeTorneo cuenta enfrentamientos pendientes', async () => {
    Ronda.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    Enfrentamiento.count.mockResolvedValue(4);

    const result = await repo.contarEnfrentamientosPendientesDeTorneo(5);

    expect(Enfrentamiento.count).toHaveBeenCalledTimes(1);
    const call = Enfrentamiento.count.mock.calls[0][0];
    expect(call.where.ronda_id).toBeDefined();
    expect(result).toBe(4);
  });
});
