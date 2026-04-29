import { Op } from 'sequelize';
import { Torneo, Inscripcion, SnapshotMazoInscripcion, Jugador, Mazo, Usuario } from '../../models/index.js';

export function listar() {
  return Torneo.findAll({
    where: {
      estado: { [Op.in]: ['pendiente', 'en_curso'] },
    },
    include: [
      {
        model: Inscripcion,
        attributes: [],
      },
    ],
    attributes: {
      include: [
        [Torneo.sequelize.fn('COUNT', Torneo.sequelize.col('Inscripcions.id')), 'total_inscritos'],
      ],
    },
    group: ['Torneo.id'],
    order: [['fecha', 'ASC']],
  });
}

export function crear(datos) {
  return Torneo.create(datos);
}

export function buscarPorId(id) {
  return Torneo.findByPk(id, {
    include: [
      {
        model: Inscripcion,
        include: [
          {
            model: Jugador,
            include: [{ model: Usuario, attributes: ['id', 'email'] }],
          },
        ],
      },
    ],
  });
}

export function crearInscripcion(datos) {
  return Inscripcion.create(datos);
}

export function crearSnapshot(datos) {
  return SnapshotMazoInscripcion.create(datos);
}

export function buscarInscripcion(torneoId, jugadorId) {
  return Inscripcion.findOne({
    where: { torneo_id: torneoId, usuario_id: jugadorId },
  });
}

export function buscarInscripcionPorMazo(torneoId, mazoId) {
  return Inscripcion.findOne({
    where: { torneo_id: torneoId, mazo_id: mazoId },
  });
}

export function listarInscripciones(torneoId) {
  return Inscripcion.findAll({
    where: { torneo_id: torneoId },
    include: [
      {
        model: Jugador,
        include: [{ model: Usuario, attributes: ['id', 'email'] }],
      },
      { model: Mazo, attributes: ['id', 'nombre', 'formato', 'slug'] },
    ],
  });
}