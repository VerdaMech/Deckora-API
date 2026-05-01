import { Carta } from '../../models/index.js';

export function buscarPorScryfallId(scryfallId) {
  return Carta.findOne({ where: { scryfall_id: scryfallId } });
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
