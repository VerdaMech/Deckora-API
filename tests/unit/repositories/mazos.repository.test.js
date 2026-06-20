import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/db.js', () => ({
  default: { query: vi.fn() },
}));

vi.mock('../../../src/models/index.js', () => ({
  Mazo: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
    sequelize: { fn: vi.fn(), col: vi.fn() },
  },
  MazoCarta: {
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  },
  Carta: {},
}));

const { Mazo, MazoCarta } = await import('../../../src/models/index.js');
const repo = await import('../../../src/modules/mazos/mazos.repository.js');

describe('mazos.repository', () => {
  beforeEach(() => vi.clearAllMocks());

  // --- listarPorJugador ---
  it('TC-REPO-MAZ-001: listarPorJugador llama a Mazo.findAll con usuario_id', async () => {
    const fakes = [{ id: 1, nombre: 'Mi Mazo' }];
    Mazo.findAll.mockResolvedValue(fakes);

    const result = await repo.listarPorJugador(10);

    expect(Mazo.findAll).toHaveBeenCalledTimes(1);
    const call = Mazo.findAll.mock.calls[0][0];
    expect(call.where).toEqual({ usuario_id: 10 });
    expect(result).toEqual(fakes);
  });

  // --- crear ---
  it('TC-REPO-MAZ-002: crear llama a Mazo.create con los datos', async () => {
    const datos = { nombre: 'Nuevo Mazo', formato: 'standard', usuario_id: 1 };
    const fake = { id: 1, ...datos };
    Mazo.create.mockResolvedValue(fake);

    const result = await repo.crear(datos);

    expect(Mazo.create).toHaveBeenCalledWith(datos);
    expect(result).toEqual(fake);
  });

  // --- buscarPorId ---
  it('TC-REPO-MAZ-003: buscarPorId llama a Mazo.findByPk con include de cartas', async () => {
    const fake = { id: 5, nombre: 'Mazo X', MazoCartas: [] };
    Mazo.findByPk.mockResolvedValue(fake);

    const result = await repo.buscarPorId(5);

    expect(Mazo.findByPk).toHaveBeenCalledTimes(1);
    const [id, options] = Mazo.findByPk.mock.calls[0];
    expect(id).toBe(5);
    expect(options.include).toBeDefined();
    expect(result).toEqual(fake);
  });

  it('TC-REPO-MAZ-004: buscarPorId retorna null si no existe', async () => {
    Mazo.findByPk.mockResolvedValue(null);

    const result = await repo.buscarPorId(999);

    expect(result).toBeNull();
  });

  // --- agregarCarta ---
  it('TC-REPO-MAZ-005: agregarCarta llama a MazoCarta.create', async () => {
    const fake = { mazo_id: 1, carta_id: 2, cantidad: 4, es_comandante: false };
    MazoCarta.create.mockResolvedValue(fake);

    const result = await repo.agregarCarta(1, 2, 4, false);

    expect(MazoCarta.create).toHaveBeenCalledWith({
      mazo_id: 1,
      carta_id: 2,
      cantidad: 4,
      es_comandante: false,
    });
    expect(result).toEqual(fake);
  });

  // --- actualizarCarta ---
  it('TC-REPO-MAZ-006: actualizarCarta llama a MazoCarta.update con where', async () => {
    MazoCarta.update.mockResolvedValue([1]);

    const result = await repo.actualizarCarta(1, 2, { cantidad: 3 });

    expect(MazoCarta.update).toHaveBeenCalledWith(
      { cantidad: 3 },
      { where: { mazo_id: 1, carta_id: 2 } },
    );
    expect(result).toEqual([1]);
  });

  // --- eliminarCarta ---
  it('TC-REPO-MAZ-007: eliminarCarta llama a MazoCarta.destroy con where', async () => {
    MazoCarta.destroy.mockResolvedValue(1);

    const result = await repo.eliminarCarta(1, 2);

    expect(MazoCarta.destroy).toHaveBeenCalledWith({
      where: { mazo_id: 1, carta_id: 2 },
    });
    expect(result).toBe(1);
  });

  // --- actualizar ---
  it('TC-REPO-MAZ-008: actualizar llama a Mazo.update y luego buscarPorId', async () => {
    Mazo.update.mockResolvedValue([1]);
    const fake = { id: 1, nombre: 'Actualizado' };
    Mazo.findByPk.mockResolvedValue(fake);

    const result = await repo.actualizar(1, { nombre: 'Actualizado' });

    expect(Mazo.update).toHaveBeenCalledWith({ nombre: 'Actualizado' }, { where: { id: 1 } });
    expect(Mazo.findByPk).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fake);
  });

  // --- eliminar ---
  it('TC-REPO-MAZ-009: eliminar llama a Mazo.destroy con where id', async () => {
    Mazo.destroy.mockResolvedValue(1);

    const result = await repo.eliminar(7);

    expect(Mazo.destroy).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(result).toBe(1);
  });
});
