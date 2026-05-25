import { Op } from 'sequelize';
import {
  sequelize,
  Ronda,
  Enfrentamiento,
  EnfrentamientoParticipante,
  Inscripcion,
  Jugador,
  Usuario,
  Mazo,
} from '../../models/index.js';

export function crear(torneoId, tipoRonda, numeroRonda) {
  return Ronda.create({ torneo_id: torneoId, tipo_ronda: tipoRonda, numero_ronda: numeroRonda });
}

export function listarPorTorneo(torneoId) {
  return Ronda.findAll({
    where: { torneo_id: torneoId },
    include: [{
      model: Enfrentamiento,
      as: 'enfrentamientos',
      include: [{
        model: EnfrentamientoParticipante,
        as: 'participantes',
        include: [{
          model: Inscripcion,
          include: [
            { model: Jugador, include: [{ model: Usuario }] },
            { model: Mazo },
          ],
        }],
      }],
    }],
    order: [
      ['numero_ronda', 'ASC'],
      [{ model: Enfrentamiento, as: 'enfrentamientos' }, 'numero_mesa', 'ASC'],
    ],
  });
}

export function buscarPorId(rondaId) {
  return Ronda.findByPk(rondaId, {
    include: [{
      model: Enfrentamiento,
      as: 'enfrentamientos',
      include: [{
        model: EnfrentamientoParticipante,
        as: 'participantes',
        include: [{
          model: Inscripcion,
          include: [
            { model: Jugador, include: [{ model: Usuario }] },
            { model: Mazo },
          ],
        }],
      }],
    }],
    order: [
      [{ model: Enfrentamiento, as: 'enfrentamientos' }, 'numero_mesa', 'ASC'],
    ],
  });
}

export async function eliminarRonda(rondaId) {
  const enfrentamientos = await Enfrentamiento.findAll({ where: { ronda_id: rondaId } });
  for (const enf of enfrentamientos) {
    await EnfrentamientoParticipante.destroy({ where: { enfrentamiento_id: enf.id } });
  }
  await Enfrentamiento.destroy({ where: { ronda_id: rondaId } });
  await Ronda.destroy({ where: { id: rondaId } });
}

export async function obtenerInscripcionesConPuntos(torneoId) {
  const inscripciones = await Inscripcion.findAll({
    where: { torneo_id: torneoId, confirmado: true },
  });

  const inscripcionesConPuntos = await Promise.all(
    inscripciones.map(async (insc) => {
      const [resultado] = await EnfrentamientoParticipante.findAll({
        where: { inscripcion_id: insc.id },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('puntos_obtenidos')), 'total_puntos'],
        ],
        raw: true,
      });
      const puntos = parseInt(resultado?.total_puntos || 0, 10);
      return {
        id: insc.id,
        jugador_id: insc.usuario_id,
        puntos_acumulados: puntos,
      };
    })
  );

  return inscripcionesConPuntos;
}

export function contarRondasDeTorneo(torneoId) {
  return Ronda.count({ where: { torneo_id: torneoId } });
}

export async function contarEnfrentamientosPendientesDeTorneo(torneoId) {
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
