import { Op, literal } from 'sequelize';
import {
  Torneo,
  Inscripcion,
  SnapshotMazoInscripcion,
  Jugador,
  Mazo,
  Usuario,
  Ronda,
  Enfrentamiento,
  EnfrentamientoParticipante,
  Estadistica,
} from '../../models/index.js';

export function listar({ organizadorId, incluirTodos = false, formato, estado, desde, hasta, q } = {}) {
  const where = {};

  if (organizadorId) {
    where.organizador_id = organizadorId;
    if (!incluirTodos) {
      where.estado = { [Op.in]: ['pendiente', 'en_curso', 'finalizado', 'cancelado'] };
    }
  } else if (!estado) {
    where.estado = { [Op.in]: ['pendiente', 'en_curso'] };
  }

  if (formato) where.formato = formato;
  if (estado) where.estado = estado;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha[Op.gte] = new Date(desde);
    if (hasta) where.fecha[Op.lte] = new Date(hasta);
  }
  if (q) where.nombre = { [Op.iLike]: `%${q}%` };

  return Torneo.findAll({
    where,
    include: [{ model: Inscripcion, attributes: [] }],
    attributes: {
      include: [
        [Torneo.sequelize.fn('COUNT', Torneo.sequelize.col('Inscripcions.id')), 'inscritos_count'],
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
            include: [{ model: Usuario, attributes: ['id', 'correo', 'nombre_usuario'] }],
          },
        ],
      },
    ],
  });
}

export async function actualizar(id, datos) {
  const [filas] = await Torneo.update(datos, { where: { id } });
  if (filas === 0) return null;
  return Torneo.findByPk(id);
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
        include: [{ model: Usuario, attributes: ['id', 'correo', 'nombre_usuario'] }],
      },
      { model: Mazo, attributes: ['id', 'nombre', 'formato', 'slug', 'comandante'] },
    ],
  });
}

export function contarInscripcionesConfirmadas(torneoId) {
  return Inscripcion.count({ where: { torneo_id: torneoId, confirmado: true } });
}

export function obtenerTablaPosiciones(torneoId) {
  return Inscripcion.findAll({
    where: { torneo_id: torneoId },
    include: [
      { model: EnfrentamientoParticipante },
      {
        model: Jugador,
        include: [{ model: Usuario, attributes: ['nombre_usuario'] }],
      },
    ],
  });
}

export function cerrarTorneo(torneoId, transaction) {
  return Torneo.update(
    { estado: 'finalizado' },
    { where: { id: torneoId }, transaction },
  );
}

export async function verificarEnfrentamientosPendientes(torneoId) {
  const rondas = await Ronda.findAll({
    where: { torneo_id: torneoId },
    attributes: ['id'],
  });
  if (rondas.length === 0) return 0;
  const rondaIds = rondas.map((r) => r.id);
  return Enfrentamiento.count({
    where: {
      ronda_id: { [Op.in]: rondaIds },
      estado: { [Op.ne]: 'finalizado' },
    },
  });
}

export function incrementarTorneosParticipados(jugadorId, transaction) {
  return Estadistica.increment('torneos_participados', {
    where: { usuario_id: jugadorId },
    transaction,
  });
}

export async function obtenerJugadoresInscritos(torneoId) {
  const inscripciones = await Inscripcion.findAll({
    where: { torneo_id: torneoId },
    attributes: ['usuario_id'],
  });
  return inscripciones.map((i) => i.usuario_id);
}

export function buscarInscripcionPorId(id) {
  return Inscripcion.findByPk(id);
}

export function eliminarInscripcion(id) {
  return Inscripcion.destroy({ where: { id } });
}

export function listarInscripcionesPendientes(torneoId) {
  return Inscripcion.findAll({
    where: { torneo_id: torneoId, confirmado: false },
    include: [
      {
        model: Jugador,
        include: [{ model: Usuario, attributes: ['id', 'nombre_usuario', 'correo'] }],
      },
      { model: Mazo, attributes: ['id', 'nombre', 'formato'] },
      { model: SnapshotMazoInscripcion, attributes: ['carta_id', 'cantidad'] },
    ],
  });
}

export async function aprobarInscripcion(inscripcionId) {
  await Inscripcion.update({ confirmado: true }, { where: { id: inscripcionId } });
  return Inscripcion.findByPk(inscripcionId);
}