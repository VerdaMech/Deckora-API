import { Estadistica, Jugador, Usuario } from '../../models/index.js';

export function buscarPorJugador(jugadorId) {
  return Estadistica.findOne({ where: { usuario_id: jugadorId } });
}

export function buscarPorJugadorPublico(jugadorId) {
  return Estadistica.findOne({
    where: { usuario_id: jugadorId },
    include: [
      {
        model: Jugador,
        include: [{ model: Usuario, attributes: ['nombre_usuario'] }],
      },
    ],
  });
}

export function obtenerRanking() {
  return Estadistica.findAll({
    include: [
      {
        model: Jugador,
        include: [{ model: Usuario, attributes: ['nombre_usuario'] }],
      },
    ],
    limit: 50,
  });
}
