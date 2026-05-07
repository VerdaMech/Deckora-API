import { Usuario, Jugador, Organizador, Tienda } from '../../models/index.js';

export function buscarPorUsername(username) {
  return Usuario.findOne({
    where: { nombre_usuario: username, activo: true },
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
}
