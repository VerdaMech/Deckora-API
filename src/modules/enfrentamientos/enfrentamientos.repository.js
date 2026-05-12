import {
  Enfrentamiento,
  EnfrentamientoParticipante,
  Inscripcion,
  Jugador,
  Usuario,
  Estadistica,
} from '../../models/index.js';

export function buscarPorId(id) {
  return Enfrentamiento.findByPk(id, {
    include: [
      {
        model: EnfrentamientoParticipante,
        include: [
          {
            model: Inscripcion,
            include: [
              {
                model: Jugador,
                include: [{ model: Usuario, attributes: ['nombre_usuario'] }],
              },
            ],
          },
        ],
      },
    ],
  });
}

export function actualizarEstado(id, estado, transaction) {
  return Enfrentamiento.update({ estado }, { where: { id }, transaction });
}

export function actualizarParticipante(id, resultado, puntos, transaction) {
  return EnfrentamientoParticipante.update(
    { resultado, puntos_obtenidos: puntos },
    { where: { id }, transaction }
  );
}

export function buscarParticipantes(enfrentamientoId) {
  return EnfrentamientoParticipante.findAll({
    where: { enfrentamiento_id: enfrentamientoId },
    include: [{ model: Inscripcion }],
  });
}

export function actualizarEstadistica(jugadorId, campo, transaction) {
  return Estadistica.increment(campo, { where: { usuario_id: jugadorId }, transaction });
}

export function buscarOCrearEstadistica(jugadorId, transaction) {
  return Estadistica.findOrCreate({
    where: { usuario_id: jugadorId },
    defaults: {
      usuario_id: jugadorId,
      partidas_ganadas: 0,
      partidas_perdidas: 0,
      partidas_empatadas: 0,
      torneos_participados: 0,
      ultima_actualizacion: new Date(),
    },
    transaction,
  });
}
