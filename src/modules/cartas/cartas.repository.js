import { Op } from 'sequelize';
import { Carta } from '../../models/index.js';

export function buscarPorScryfallId(scryfallId) {
  return Carta.findOne({ where: { scryfall_id: scryfallId } });
}

export function buscarPorId(id) {
  return Carta.findByPk(id);
}

export function buscarPorNombre(q, limit = 20) {
  return Carta.findAll({
    where: { nombre: { [Op.iLike]: `%${q}%` } },
    limit,
    order: [['nombre', 'ASC']],
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
