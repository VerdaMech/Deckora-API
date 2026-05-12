import { Carta } from '../../models/index.js';

export async function listarCartas({ page, limit, set_codigo }) {
  const where = {};
  if (set_codigo) {
    where.set_codigo = set_codigo;
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
