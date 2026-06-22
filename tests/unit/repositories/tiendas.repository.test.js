import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/models/index.js', () => ({
  Tienda: {
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  },
  Usuario: { name: 'Usuario' },
  Torneo: {
    findAll: vi.fn(),
  },
}));

const { Tienda, Usuario, Torneo } = await import('../../../src/models/index.js');
const repo = await import('../../../src/modules/tiendas/tiendas.repository.js');

describe('tiendas.repository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-REPO-TIE-001: listarTodas llama Tienda.findAll con include de Usuario activo', async () => {
    const tiendas = [{ id: 1, nombre_tienda: 'Tienda A' }];
    Tienda.findAll.mockResolvedValue(tiendas);

    const result = await repo.listarTodas();

    expect(Tienda.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: Usuario,
          where: { activo: true },
          attributes: ['id', 'nombre_usuario', 'correo'],
        },
      ],
    });
    expect(result).toEqual(tiendas);
  });

  it('TC-REPO-TIE-002: buscarPorId llama Tienda.findOne con usuario_id e include Usuario', async () => {
    const tienda = { usuario_id: 5, nombre_tienda: 'Mi Tienda' };
    Tienda.findOne.mockResolvedValue(tienda);

    const result = await repo.buscarPorId(5);

    expect(Tienda.findOne).toHaveBeenCalledWith({
      where: { usuario_id: 5 },
      include: [{ model: Usuario, attributes: ['id', 'nombre_usuario', 'correo'] }],
    });
    expect(result).toEqual(tienda);
  });

  it('TC-REPO-TIE-003: buscarPorId retorna null si no existe', async () => {
    Tienda.findOne.mockResolvedValue(null);

    const result = await repo.buscarPorId(999);

    expect(Tienda.findOne).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('TC-REPO-TIE-004: actualizar llama Tienda.update con datos y where usuario_id', async () => {
    Tienda.update.mockResolvedValue([1]);
    const datos = { nombre_tienda: 'Nuevo Nombre' };

    const result = await repo.actualizar(5, datos);

    expect(Tienda.update).toHaveBeenCalledWith(datos, { where: { usuario_id: 5 } });
    expect(result).toEqual([1]);
  });

  it('TC-REPO-TIE-005: buscarTornesDeTienda llama Torneo.findAll con organizador_id', async () => {
    const torneos = [{ id: 10, nombre: 'Torneo A' }];
    Torneo.findAll.mockResolvedValue(torneos);

    const result = await repo.buscarTornesDeTienda(3);

    expect(Torneo.findAll).toHaveBeenCalledWith({ where: { organizador_id: 3 } });
    expect(result).toEqual(torneos);
  });
});
