import { Op, literal } from 'sequelize';
import { Carta } from '../../models/index.js';

function buildFiltroColector({ incluir_tokens = false, incluir_arte = false } = {}) {
  if (incluir_tokens && incluir_arte) return null;

  const condiciones = [];

  if (!incluir_tokens) {
    condiciones.push({ numero_colector: { [Op.notLike]: 'T%' } });
  }
  if (!incluir_arte) {
    condiciones.push({ numero_colector: { [Op.notLike]: 'A%' } });
  }

  return {
    [Op.or]: [
      { numero_colector: null },
      { [Op.and]: condiciones },
    ],
  };
}

export async function listarCartas({ page, limit, set_codigo, incluir_tokens = false, incluir_arte = false, formato }) {
  const where = {};
  if (set_codigo) {
    where.set_codigo = set_codigo;
  }

  const condicionesAnd = [];

  const filtroColector = buildFiltroColector({ incluir_tokens, incluir_arte });
  if (filtroColector) {
    condicionesAnd.push(filtroColector);
  }

  if (formato) {
    condicionesAnd.push(literal(`legalities->>'${formato.toLowerCase()}' = 'legal'`));
  } else {
    condicionesAnd.push(
      literal(`(
        legalities->>'commander' = 'legal' OR
        legalities->>'standard' = 'legal' OR
        legalities->>'modern' = 'legal' OR
        legalities->>'pioneer' = 'legal' OR
        legalities->>'legacy' = 'legal'
      )`)
    );
  }

  if (condicionesAnd.length > 0) {
    where[Op.and] = condicionesAnd;
  }

  const { rows, count } = await Carta.findAndCountAll({
    where,
    order: [['nombre', 'ASC']],
    limit,
    offset: (page - 1) * limit,
    attributes: [
      'id', 'scryfall_id', 'nombre', 'tipo', 'costo_mana',
      'imagen_url', 'set_codigo', 'set_nombre', 'set_fecha_lanzamiento',
      'resistencia', 'fuerza', 'es_tierra_basica',
    ],
  });

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
}

export async function listarSets() {
  const [rows] = await Carta.sequelize.query(`
    SELECT
      set_codigo AS codigo,
      MAX(set_nombre) AS nombre,
      MAX(set_fecha_lanzamiento) AS fecha_lanzamiento,
      EXTRACT(YEAR FROM MAX(set_fecha_lanzamiento))::int AS anio,
      COUNT(*)::int AS cantidad_cartas
    FROM cartas
    WHERE set_codigo IS NOT NULL
      AND (
        numero_colector IS NULL
        OR (numero_colector NOT LIKE 'T%' AND numero_colector NOT LIKE 'A%')
      )
    GROUP BY set_codigo
    ORDER BY MAX(set_fecha_lanzamiento) DESC NULLS LAST, set_codigo ASC
  `);

  const byYear = new Map();
  for (const row of rows) {
    const anio = row.anio ?? 0;
    if (!byYear.has(anio)) {
      byYear.set(anio, []);
    }
    byYear.get(anio).push({
      codigo: row.codigo,
      nombre: row.nombre,
      cantidad_cartas: row.cantidad_cartas,
    });
  }

  const data = Array.from(byYear.entries())
    .sort(([a], [b]) => b - a)
    .map(([anio, sets]) => ({ anio, sets }));

  return { data };
}
