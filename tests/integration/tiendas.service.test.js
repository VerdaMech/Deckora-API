import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock del repositorio de tiendas ────────────────────────────────────────
vi.mock('../../src/modules/tiendas/tiendas.repository.js', () => ({
  listarTodas: vi.fn(),
  buscarPorId: vi.fn(),
  actualizar: vi.fn(),
  buscarTornesDeTienda: vi.fn(),
}));

const repo = await import('../../src/modules/tiendas/tiendas.repository.js');
const service = await import('../../src/modules/tiendas/tiendas.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('tiendas.service — listarTodas y buscarCercanas', () => {
  it('TC-TI-001: listarTodas delega en el repositorio', async () => {
    const tiendas = [{ id: 't1', nombre: 'Tienda A' }];
    repo.listarTodas.mockResolvedValue(tiendas);

    const res = await service.listarTodas();

    expect(repo.listarTodas).toHaveBeenCalledTimes(1);
    expect(res).toBe(tiendas);
  });

  it('TC-TI-002: buscarCercanas delega en listarTodas del repositorio', async () => {
    const tiendas = [{ id: 't1' }, { id: 't2' }];
    repo.listarTodas.mockResolvedValue(tiendas);

    const res = await service.buscarCercanas();

    expect(repo.listarTodas).toHaveBeenCalledTimes(1);
    expect(res).toBe(tiendas);
  });
});

describe('tiendas.service — buscarPorId', () => {
  it('TC-TI-003: buscarPorId devuelve la tienda cuando existe', async () => {
    const tienda = { id: 't1', nombre: 'Tienda Central' };
    repo.buscarPorId.mockResolvedValue(tienda);

    const res = await service.buscarPorId('t1');

    expect(repo.buscarPorId).toHaveBeenCalledWith('t1');
    expect(res).toBe(tienda);
  });

  it('TC-TI-004: buscarPorId con tienda inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(service.buscarPorId('t-x')).rejects.toMatchObject({
      status: 404,
      message: 'Tienda no encontrada',
    });
  });
});

describe('tiendas.service — actualizar', () => {
  it('TC-TI-005: actualizar llama al repositorio y devuelve la tienda actualizada', async () => {
    const tiendaActualizada = { id: 't1', nombre: 'Tienda Renovada' };
    repo.actualizar.mockResolvedValue([1]);
    repo.buscarPorId.mockResolvedValue(tiendaActualizada);

    const res = await service.actualizar('t1', { nombre: 'Tienda Renovada' });

    expect(repo.actualizar).toHaveBeenCalledWith('t1', { nombre: 'Tienda Renovada' });
    expect(repo.buscarPorId).toHaveBeenCalledWith('t1');
    expect(res).toBe(tiendaActualizada);
  });
});

describe('tiendas.service — buscarTornesDeTienda', () => {
  it('TC-TI-006: buscarTornesDeTienda delega en el repositorio', async () => {
    const torneos = [{ id: 'tor-1', nombre: 'Torneo Semanal' }];
    repo.buscarTornesDeTienda.mockResolvedValue(torneos);

    const res = await service.buscarTornesDeTienda('t1');

    expect(repo.buscarTornesDeTienda).toHaveBeenCalledWith('t1');
    expect(res).toBe(torneos);
  });
});
