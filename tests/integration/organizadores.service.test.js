import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock del repositorio de organizadores ──────────────────────────────────
vi.mock('../../src/modules/organizadores/organizadores.repository.js', () => ({
  buscarPorId: vi.fn(),
  actualizar: vi.fn(),
}));

const repo = await import('../../src/modules/organizadores/organizadores.repository.js');
const service = await import('../../src/modules/organizadores/organizadores.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('organizadores.service — obtenerMio', () => {
  it('TC-ORG-001: obtenerMio devuelve el organizador cuando existe', async () => {
    const organizador = { usuario_id: 'u1', nombre: 'Organizador A' };
    repo.buscarPorId.mockResolvedValue(organizador);

    const res = await service.obtenerMio('u1');

    expect(repo.buscarPorId).toHaveBeenCalledWith('u1');
    expect(res).toBe(organizador);
  });

  it('TC-ORG-002: obtenerMio con perfil inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(service.obtenerMio('u-x')).rejects.toMatchObject({
      status: 404,
      message: 'Perfil de organizador no encontrado',
    });
  });
});

describe('organizadores.service — actualizarMio', () => {
  it('TC-ORG-003: actualizarMio llama actualizar y devuelve el perfil actualizado', async () => {
    const perfilActualizado = { usuario_id: 'u1', nombre: 'Nuevo Nombre' };
    repo.actualizar.mockResolvedValue([1]);
    repo.buscarPorId.mockResolvedValue(perfilActualizado);

    const res = await service.actualizarMio('u1', { nombre: 'Nuevo Nombre' });

    expect(repo.actualizar).toHaveBeenCalledWith('u1', { nombre: 'Nuevo Nombre' });
    expect(repo.buscarPorId).toHaveBeenCalledWith('u1');
    expect(res).toBe(perfilActualizado);
  });

  it('TC-ORG-004: actualizarMio llama actualizar antes de buscarPorId', async () => {
    const callOrder = [];
    repo.actualizar.mockImplementation(() => {
      callOrder.push('actualizar');
      return Promise.resolve([1]);
    });
    repo.buscarPorId.mockImplementation(() => {
      callOrder.push('buscarPorId');
      return Promise.resolve({ usuario_id: 'u1' });
    });

    await service.actualizarMio('u1', { nombre: 'Test' });

    expect(callOrder).toEqual(['actualizar', 'buscarPorId']);
  });
});
