import { Op, literal } from 'sequelize';
import { Carta } from '../../models/index.js';

export function buscarPorScryfallId(scryfallId) {
  return Carta.findOne({ where: { scryfall_id: scryfallId } });
}

export function buscarPorId(id) {
  return Carta.findByPk(id);
}

export function buscarPorNombre(q, limit = 20, formato = null) {
  const condicionesAnd = [
    { nombre: { [Op.iLike]: `%${q}%` } },
    {
      [Op.or]: [
        { numero_colector: null },
        {
          [Op.and]: [
            { numero_colector: { [Op.notLike]: 'T%' } },
            { numero_colector: { [Op.notLike]: 'A%' } },
          ],
        },
      ],
    },
  ];

  if (formato) {
    condicionesAnd.push(
      literal(`(legalities IS NULL OR legalities->>'${formato.toLowerCase()}' IS NULL OR legalities->>'${formato.toLowerCase()}' NOT IN ('banned', 'not_legal'))`)
    );
  } else {
    condicionesAnd.push(
      literal(`(
        legalities IS NULL OR
        legalities->>'commander' = 'legal' OR
        legalities->>'standard' = 'legal' OR
        legalities->>'modern' = 'legal' OR
        legalities->>'pioneer' = 'legal' OR
        legalities->>'legacy' = 'legal'
      )`)
    );
  }

  return Carta.findAll({
    where: { [Op.and]: condicionesAnd },
    limit,
    order: [['nombre', 'ASC']],
    attributes: [
      'id', 'scryfall_id', 'nombre', 'tipo', 'costo_mana',
      'imagen_url', 'set_codigo', 'es_tierra_basica', 'legalities',
    ],
  });
}

export function buscarPorNombreExacto(nombre, formato = null) {
  const condicionesAnd = [
    { nombre: { [Op.iLike]: nombre } },
    {
      [Op.or]: [
        { numero_colector: null },
        {
          [Op.and]: [
            { numero_colector: { [Op.notLike]: 'T%' } },
            { numero_colector: { [Op.notLike]: 'A%' } },
          ],
        },
      ],
    },
  ];

  if (formato) {
    condicionesAnd.push(
      literal(`(legalities IS NULL OR legalities->>'${formato.toLowerCase()}' IS NULL OR legalities->>'${formato.toLowerCase()}' NOT IN ('banned', 'not_legal'))`)
    );
  }

  return Carta.findOne({
    where: { [Op.and]: condicionesAnd },
    attributes: ['id', 'scryfall_id', 'nombre', 'tipo', 'costo_mana', 'imagen_url', 'set_codigo', 'es_tierra_basica', 'legalities'],
    order: [['nombre', 'ASC']],
  });
}

export function buscarPorSetYNumero(setCodigo, numeroColector) {
  return Carta.findOne({
    where: {
      set_codigo: setCodigo.toLowerCase(),
      numero_colector: numeroColector,
    },
  });
}

export function upsert(datos) {
  return Carta.upsert(datos, { returning: true });
}

export function listar({ page, limit }) {
  const options = { order: [['nombre', 'ASC']] };
  if (limit !== undefined) {
    options.limit = limit;
    options.offset = (page - 1) * limit;
  }
  return Carta.findAndCountAll(options);
}
