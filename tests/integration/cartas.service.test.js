import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock del repositorio de cartas ─────────────────────────────────────────
vi.mock('../../src/modules/cartas/cartas.repository.js', () => ({
  buscarPorNombre: vi.fn(),
  listar: vi.fn(),
  buscarPorScryfallId: vi.fn(),
}));

const repo = await import('../../src/modules/cartas/cartas.repository.js');
const service = await import('../../src/modules/cartas/cartas.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cartas.service — buscarEnBD', () => {
  it('TC-CA-001: buscarEnBD delega en el repositorio con los parámetros correctos', async () => {
    const cartas = [{ id: 'c1', nombre: 'Lightning Bolt' }];
    repo.buscarPorNombre.mockResolvedValue(cartas);

    const res = await service.buscarEnBD('Lightning');

    expect(repo.buscarPorNombre).toHaveBeenCalledWith('Lightning', 20, null);
    expect(res).toBe(cartas);
  });

  it('TC-CA-002: buscarEnBD pasa el formato cuando se proporciona', async () => {
    repo.buscarPorNombre.mockResolvedValue([]);

    await service.buscarEnBD('Bolt', 'commander');

    expect(repo.buscarPorNombre).toHaveBeenCalledWith('Bolt', 20, 'commander');
  });
});

describe('cartas.service — listar', () => {
  it('TC-CA-003: listar delega en el repositorio con page y limit', async () => {
    const resultado = { rows: [], count: 0 };
    repo.listar.mockResolvedValue(resultado);

    const res = await service.listar({ page: 1, limit: 20 });

    expect(repo.listar).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(res).toBe(resultado);
  });
});

describe('cartas.service — obtenerPorScryfallId', () => {
  it('TC-CA-004: obtenerPorScryfallId devuelve la carta cuando existe', async () => {
    const carta = { id: 'c1', scryfall_id: 'sf-1', nombre: 'Sol Ring' };
    repo.buscarPorScryfallId.mockResolvedValue(carta);

    const res = await service.obtenerPorScryfallId('sf-1');

    expect(repo.buscarPorScryfallId).toHaveBeenCalledWith('sf-1');
    expect(res).toBe(carta);
  });

  it('TC-CA-005: obtenerPorScryfallId con carta inexistente devuelve 404', async () => {
    repo.buscarPorScryfallId.mockResolvedValue(null);

    await expect(service.obtenerPorScryfallId('sf-x')).rejects.toMatchObject({
      status: 404,
      message: 'Carta no encontrada',
    });
  });
});
