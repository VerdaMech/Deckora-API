import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Op } from 'sequelize';

vi.mock('../../../src/models/index.js', () => ({
  Usuario: {
    findOne: vi.fn(),
  },
  Jugador: { name: 'Jugador' },
  Organizador: { name: 'Organizador' },
  Tienda: { name: 'Tienda' },
}));

const { Usuario, Jugador, Organizador, Tienda } = await import('../../../src/models/index.js');
const repo = await import('../../../src/modules/usuarios/usuarios.repository.js');

describe('usuarios.repository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-REPO-USU-001: buscarPorUsername llama Usuario.findOne con iLike, activo e includes', async () => {
    const usuario = { id: 1, nombre_usuario: 'jugador1', rol: 'jugador' };
    Usuario.findOne.mockResolvedValue(usuario);

    const result = await repo.buscarPorUsername('jugador1');

    expect(Usuario.findOne).toHaveBeenCalledWith({
      where: { nombre_usuario: { [Op.iLike]: 'jugador1' }, activo: true },
      include: [
        {
          model: Jugador,
          required: false,
          attributes: ['usuario_id', 'formato_preferido'],
        },
        {
          model: Organizador,
          required: false,
          attributes: ['usuario_id', 'descripcion', 'sitio_web', 'verificado'],
        },
        {
          model: Tienda,
          required: false,
          attributes: ['usuario_id', 'nombre_tienda', 'direccion', 'numero_telefono', 'horario_apertura'],
        },
      ],
    });
    expect(result).toEqual(usuario);
  });

  it('TC-REPO-USU-002: buscarPorUsername retorna null si usuario no existe', async () => {
    Usuario.findOne.mockResolvedValue(null);

    const result = await repo.buscarPorUsername('inexistente');

    expect(Usuario.findOne).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
