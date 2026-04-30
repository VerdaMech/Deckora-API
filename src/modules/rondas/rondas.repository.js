import { sequelize, Ronda, Enfrentamiento, EnfrentamientoParticipante, Inscripcion } from '../../models/index.js';

export function crear(torneoId, tipoRonda, numeroRonda) {
  return Ronda.create({ torneo_id: torneoId, tipo_ronda: tipoRonda, numero_ronda: numeroRonda });
}

export function listarPorTorneo(torneoId) {
  return Ronda.findAll({
    where: { torneo_id: torneoId },
    include: [{ model: Enfrentamiento }],
    order: [['numero_ronda', 'ASC']],
  });
}

export function buscarPorId(rondaId) {
  return Ronda.findByPk(rondaId, {
    include: [
      {
        model: Enfrentamiento,
        include: [{ model: EnfrentamientoParticipante }],
      },
    ],
  });
}

export async function obtenerInscripcionesConPuntos(torneoId) {
  const inscripciones = await Inscripcion.findAll({
    where: { torneo_id: torneoId },
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
