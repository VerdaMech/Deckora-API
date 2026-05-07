import { Usuario, Jugador, Organizador, Tienda } from '../../models/index.js';

export function buscarPorUsername(username) {
  return Usuario.findOne({
    where: { nombre_usuario: username, activo: true },
    include: [
      { model: Jugador, required: false },
      { model: Organizador, required: false },
      { model: Tienda, required: false },
    ],
  });
}
