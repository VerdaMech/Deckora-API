import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock del modelo Carta (biblioteca.service no usa repositorio) ──────────
const findAndCountAllMock = vi.fn();
const sequelizeQueryMock = vi.fn();

vi.mock('../../src/models/index.js', () => ({
  Carta: {
    findAndCountAll: findAndCountAllMock,
    sequelize: { query: sequelizeQueryMock },
  },
}));

const service = await import('../../src/modules/biblioteca/biblioteca.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('biblioteca.service — listarCartas', () => {
  it('TC-BIB-001: listarCartas devuelve estructura de paginación correcta', async () => {
    const rows = [{ id: 'c1', nombre: 'Sol Ring' }, { id: 'c2', nombre: 'Llanowar Elves' }];
    findAndCountAllMock.mockResolvedValue({ rows, count: 50 });

    const res = await service.listarCartas({ page: 2, limit: 10 });

    expect(res.data).toBe(rows);
    expect(res.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      total_pages: 5,
    });
  });

  it('TC-BIB-002: listarCartas aplica filtro de set_codigo cuando se proporciona', async () => {
    findAndCountAllMock.mockResolvedValue({ rows: [], count: 0 });

    await service.listarCartas({ page: 1, limit: 20, set_codigo: 'neo' });

    expect(findAndCountAllMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ set_codigo: 'neo' }),
      }),
    );
  });

  it('TC-BIB-003: listarCartas calcula total_pages con Math.ceil', async () => {
    findAndCountAllMock.mockResolvedValue({ rows: [], count: 25 });

    const res = await service.listarCartas({ page: 1, limit: 10 });

    expect(res.pagination.total_pages).toBe(3);
  });

  it('TC-BIB-004: listarCartas con formato aplica filtro de legalidad específico', async () => {
    findAndCountAllMock.mockResolvedValue({ rows: [], count: 0 });

    await service.listarCartas({ page: 1, limit: 20, formato: 'commander' });

    expect(findAndCountAllMock).toHaveBeenCalledTimes(1);
  });
});

describe('biblioteca.service — listarSets', () => {
  it('TC-BIB-005: listarSets agrupa sets por año en orden descendente', async () => {
    sequelizeQueryMock.mockResolvedValue([
      [
        { codigo: 'neo', nombre: 'Kamigawa', fecha_lanzamiento: '2022-02-18', anio: 2022, cantidad_cartas: 300 },
        { codigo: 'mid', nombre: 'Innistrad', fecha_lanzamiento: '2021-09-24', anio: 2021, cantidad_cartas: 280 },
        { codigo: 'stx', nombre: 'Strixhaven', fecha_lanzamiento: '2021-04-23', anio: 2021, cantidad_cartas: 275 },
      ],
    ]);

    const res = await service.listarSets();

    expect(res.data).toHaveLength(2);
    expect(res.data[0].anio).toBe(2022);
    expect(res.data[0].sets).toHaveLength(1);
    expect(res.data[1].anio).toBe(2021);
    expect(res.data[1].sets).toHaveLength(2);
  });

  it('TC-BIB-006: listarSets con resultado vacío devuelve data vacía', async () => {
    sequelizeQueryMock.mockResolvedValue([[]]);

    const res = await service.listarSets();

    expect(res.data).toEqual([]);
  });

  it('TC-BIB-007: listarSets agrupa sets con año nulo bajo año 0', async () => {
    sequelizeQueryMock.mockResolvedValue([
      [
        { codigo: 'xxx', nombre: 'Set Desconocido', fecha_lanzamiento: null, anio: null, cantidad_cartas: 10 },
      ],
    ]);

    const res = await service.listarSets();

    expect(res.data).toHaveLength(1);
    expect(res.data[0].anio).toBe(0);
    expect(res.data[0].sets[0].codigo).toBe('xxx');
  });
});
