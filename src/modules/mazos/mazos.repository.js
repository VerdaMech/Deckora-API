import { QueryTypes } from 'sequelize';
import { Mazo, MazoCarta, Carta } from '../../models/index.js';
import sequelize from '../../config/db.js';

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
        as: 'MazoCartas',
        attributes: [],
      },
    ],
    attributes: {
      include: [
        [Mazo.sequelize.fn('COALESCE', Mazo.sequelize.fn('SUM', Mazo.sequelize.col('MazoCartas.cantidad')), 0), 'total_cartas'],
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
        as: 'MazoCartas',
        include: [{ model: Carta, as: 'Carta' }],
        order: [['createdAt', 'DESC']],
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

export async function actualizar(id, datos) {
  await Mazo.update(datos, { where: { id } });
  return buscarPorId(id);
}

export async function buscarRecomendaciones(embeddingPromedio, excluirIds, formato, limit = 10) {
  const embeddingStr = `[${embeddingPromedio.join(',')}]`;

  const whereExcluir =
    excluirIds.length > 0 ? 'AND id NOT IN (:excluirIds)' : '';

  const whereFormato = formato
    ? `AND (legalities IS NULL OR legalities->>'${formato.toLowerCase()}' IS NULL OR legalities->>'${formato.toLowerCase()}' NOT IN ('banned', 'not_legal'))`
    : '';

  const sql = `
    SELECT id, nombre, tipo, costo_mana, imagen_url, texto, cmc, colors, legalities
    FROM cartas
    WHERE embedding IS NOT NULL
      ${whereExcluir}
      ${whereFormato}
    ORDER BY embedding <=> :embedding::vector
    LIMIT :limit
  `;

  const replacements = { embedding: embeddingStr, limit };
  if (excluirIds.length > 0) replacements.excluirIds = excluirIds;

  return sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
}