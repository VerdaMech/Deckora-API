import { QueryTypes } from 'sequelize';
import { sequelize, Estadistica, Jugador, Usuario } from '../../models/index.js';

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

export function buscarHistorialMeses(jugadorId) {
  return sequelize.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', t.fecha), 'Mon')    AS mes,
       TO_CHAR(DATE_TRUNC('month', t.fecha), 'YYYY-MM') AS mes_key,
       COUNT(CASE WHEN ep.resultado = 'ganador' THEN 1 END)::integer AS ganadas,
       COUNT(CASE WHEN ep.resultado = 'perdedor' THEN 1 END)::integer AS perdidas
     FROM enfrentamiento_participantes ep
     JOIN inscripciones i   ON ep.inscripcion_id    = i.id
     JOIN enfrentamientos e ON ep.enfrentamiento_id = e.id
     JOIN rondas r          ON e.ronda_id           = r.id
     JOIN torneos t         ON r.torneo_id          = t.id
     WHERE i.usuario_id = :jugadorId
       AND ep.resultado IN ('ganador', 'perdedor', 'empate')
     GROUP BY DATE_TRUNC('month', t.fecha)
     ORDER BY DATE_TRUNC('month', t.fecha)
     LIMIT 12`,
    { replacements: { jugadorId }, type: QueryTypes.SELECT }
  );
}

export function buscarHistorialDias(jugadorId, mesKey) {
  return sequelize.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('day', t.fecha), 'DD') AS dia,
       COUNT(CASE WHEN ep.resultado = 'ganador' THEN 1 END)::integer AS ganadas,
       COUNT(CASE WHEN ep.resultado = 'perdedor' THEN 1 END)::integer AS perdidas
     FROM enfrentamiento_participantes ep
     JOIN inscripciones i   ON ep.inscripcion_id    = i.id
     JOIN enfrentamientos e ON ep.enfrentamiento_id = e.id
     JOIN rondas r          ON e.ronda_id           = r.id
     JOIN torneos t         ON r.torneo_id          = t.id
     WHERE i.usuario_id = :jugadorId
       AND TO_CHAR(DATE_TRUNC('month', t.fecha), 'YYYY-MM') = :mesKey
       AND ep.resultado IN ('ganador', 'perdedor', 'empate')
     GROUP BY DATE_TRUNC('day', t.fecha)
     ORDER BY DATE_TRUNC('day', t.fecha)`,
    { replacements: { jugadorId, mesKey }, type: QueryTypes.SELECT }
  );
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
