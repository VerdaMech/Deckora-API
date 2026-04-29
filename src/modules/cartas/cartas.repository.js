import { Carta } from '../../models/index.js';

export function buscarPorScryfallId(scryfallId) {
  return Carta.findOne({ where: { scryfall_id: scryfallId } });
}

export function upsert(datos) {
  return Carta.upsert(datos, { returning: true });
}

export function listar({ page, limit }) {
  return Carta.findAndCountAll({
    limit,
    offset: (page - 1) * limit,
    order: [['nombre', 'ASC']],
  });
}
