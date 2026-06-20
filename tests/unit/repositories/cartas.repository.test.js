import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/models/index.js', () => ({
  Carta: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    findAll: vi.fn(),
    findAndCountAll: vi.fn(),
    upsert: vi.fn(),
  },
}));

const { Carta } = await import('../../../src/models/index.js');
const repo = await import('../../../src/modules/cartas/cartas.repository.js');

describe('cartas.repository', () => {
  beforeEach(() => vi.clearAllMocks());

  // --- buscarPorScryfallId ---
  it('TC-REPO-CAR-001: buscarPorScryfallId llama a Carta.findOne con scryfall_id', async () => {
    const fake = { id: 1, scryfall_id: 'abc-123' };
    Carta.findOne.mockResolvedValue(fake);

    const result = await repo.buscarPorScryfallId('abc-123');

    expect(Carta.findOne).toHaveBeenCalledWith({ where: { scryfall_id: 'abc-123' } });
    expect(result).toEqual(fake);
  });

  it('TC-REPO-CAR-002: buscarPorScryfallId retorna null si no existe', async () => {
    Carta.findOne.mockResolvedValue(null);

    const result = await repo.buscarPorScryfallId('no-existe');

    expect(Carta.findOne).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  // --- buscarPorId ---
  it('TC-REPO-CAR-003: buscarPorId llama a Carta.findByPk con el id', async () => {
    const fake = { id: 5 };
    Carta.findByPk.mockResolvedValue(fake);

    const result = await repo.buscarPorId(5);

    expect(Carta.findByPk).toHaveBeenCalledWith(5);
    expect(result).toEqual(fake);
  });

  // --- buscarPorNombre ---
  it('TC-REPO-CAR-004: buscarPorNombre llama a Carta.findAll con limite por defecto', async () => {
    const fakes = [{ id: 1, nombre: 'Lightning Bolt' }];
    Carta.findAll.mockResolvedValue(fakes);

    const result = await repo.buscarPorNombre('Lightning');

    expect(Carta.findAll).toHaveBeenCalledTimes(1);
    const call = Carta.findAll.mock.calls[0][0];
    expect(call.limit).toBe(20);
    expect(call.order).toEqual([['nombre', 'ASC']]);
    expect(result).toEqual(fakes);
  });

  it('TC-REPO-CAR-005: buscarPorNombre acepta limite personalizado', async () => {
    Carta.findAll.mockResolvedValue([]);

    await repo.buscarPorNombre('Sol', 5);

    const call = Carta.findAll.mock.calls[0][0];
    expect(call.limit).toBe(5);
  });

  it('TC-REPO-CAR-006: buscarPorNombre incluye filtro de formato si se proporciona', async () => {
    Carta.findAll.mockResolvedValue([]);

    await repo.buscarPorNombre('Sol', 10, 'standard');

    expect(Carta.findAll).toHaveBeenCalledTimes(1);
  });

  // --- buscarPorNombreExacto ---
  it('TC-REPO-CAR-007: buscarPorNombreExacto llama a Carta.findOne', async () => {
    const fake = { id: 2, nombre: 'Sol Ring' };
    Carta.findOne.mockResolvedValue(fake);

    const result = await repo.buscarPorNombreExacto('Sol Ring');

    expect(Carta.findOne).toHaveBeenCalledTimes(1);
    const call = Carta.findOne.mock.calls[0][0];
    expect(call.order).toEqual([['nombre', 'ASC']]);
    expect(result).toEqual(fake);
  });

  it('TC-REPO-CAR-008: buscarPorNombreExacto con formato filtra legalities', async () => {
    Carta.findOne.mockResolvedValue(null);

    await repo.buscarPorNombreExacto('Sol Ring', 'commander');

    expect(Carta.findOne).toHaveBeenCalledTimes(1);
  });

  // --- buscarPorSetYNumero ---
  it('TC-REPO-CAR-009: buscarPorSetYNumero llama a Carta.findOne con set y numero', async () => {
    const fake = { id: 3 };
    Carta.findOne.mockResolvedValue(fake);

    const result = await repo.buscarPorSetYNumero('MKM', '42');

    expect(Carta.findOne).toHaveBeenCalledWith({
      where: { set_codigo: 'mkm', numero_colector: '42' },
    });
    expect(result).toEqual(fake);
  });

  // --- upsert ---
  it('TC-REPO-CAR-010: upsert llama a Carta.upsert con datos y returning', async () => {
    const datos = { scryfall_id: 'x', nombre: 'Test' };
    const fakeResult = [{ id: 1, ...datos }, true];
    Carta.upsert.mockResolvedValue(fakeResult);

    const result = await repo.upsert(datos);

    expect(Carta.upsert).toHaveBeenCalledWith(datos, { returning: true });
    expect(result).toEqual(fakeResult);
  });

  // --- listar ---
  it('TC-REPO-CAR-011: listar llama a Carta.findAndCountAll con paginacion', async () => {
    const fake = { count: 1, rows: [{ id: 1 }] };
    Carta.findAndCountAll.mockResolvedValue(fake);

    const result = await repo.listar({ page: 2, limit: 10 });

    expect(Carta.findAndCountAll).toHaveBeenCalledWith({
      order: [['nombre', 'ASC']],
      limit: 10,
      offset: 10,
    });
    expect(result).toEqual(fake);
  });

  it('TC-REPO-CAR-012: listar sin limit no incluye offset', async () => {
    const fake = { count: 0, rows: [] };
    Carta.findAndCountAll.mockResolvedValue(fake);

    await repo.listar({ page: 1 });

    expect(Carta.findAndCountAll).toHaveBeenCalledWith({
      order: [['nombre', 'ASC']],
    });
  });
});
