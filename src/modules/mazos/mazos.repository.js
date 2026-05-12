import { Mazo, MazoCarta, Carta } from '../../models/index.js';

export function listarPublicosPorJugador(jugadorId) {
  return Mazo.findAll({
    where: { usuario_id: jugadorId, publico: true },
    attributes: ['id', 'nombre', 'formato', 'descripcion', 'slug', 'fecha_creacion'],
    order: [['fecha_creacion', 'DESC']],
  });
}

export function listarPorJugador(jugadorId) {
  return Mazo.findAll({
    where: { usuario_id: jugadorId },
    include: [
      {
        model: MazoCarta,
        attributes: [],
      },
    ],
    attributes: {
      include: [
        [Mazo.sequelize.fn('COUNT', Mazo.sequelize.col('MazoCarta.id')), 'total_cartas'],
      ],
    },
    group: ['Mazo.id'],
    order: [['fecha_creacion', 'DESC']],
  });
}

export function crear(datos) {
  return Mazo.create(datos);
}

export function buscarPorId(id) {
  return Mazo.findByPk(id, {
    include: [
      {
        model: MazoCarta,
        include: [{ model: Carta }],
      },
    ],
  });
}

export function agregarCarta(mazoId, cartaId, cantidad, esComandante) {
  return MazoCarta.create({
    mazo_id: mazoId,
    carta_id: cartaId,
    cantidad,
    es_comandante: esComandante,
  });
}

export function actualizarCarta(mazoId, cartaId, datos) {
  return MazoCarta.update(datos, {
    where: { mazo_id: mazoId, carta_id: cartaId },
  });
}

export function eliminarCarta(mazoId, cartaId) {
  return MazoCarta.destroy({
    where: { mazo_id: mazoId, carta_id: cartaId },
  });
}