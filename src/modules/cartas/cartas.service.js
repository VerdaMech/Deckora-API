import { delay } from '../../utils/delay.js';
import { mapearCarta } from '../../utils/scryfallMapper.js';
import * as cartasRepository from './cartas.repository.js';

const SCRYFALL_HEADERS = {
  'User-Agent': 'DeckoraApp/1.0',
  'Accept': 'application/json',
};

async function fetchScryfall(url) {
  const res = await fetch(url, { headers: SCRYFALL_HEADERS });

  if (res.status === 404) {
    const err = new Error('Carta no encontrada en Scryfall');
    err.status = 404;
    throw err;
  }

  if (!res.ok) {
    const err = new Error('Error al consultar Scryfall');
    err.status = 502;
    throw err;
  }

  return res.json();
}

export async function buscarEnScryfall(q) {
  const data = await fetchScryfall(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}`
  );
  return data.data;
}

export async function listar({ page, limit }) {
  return cartasRepository.listar({ page, limit });
}

export async function obtenerPorScryfallId(scryfallId) {
  const local = await cartasRepository.buscarPorScryfallId(scryfallId);
  if (local) return local;

  const cartaScryfall = await fetchScryfall(
    `https://api.scryfall.com/cards/${scryfallId}`
  );
  await delay(110);

  const datos = mapearCarta(cartaScryfall);
  const [carta] = await cartasRepository.upsert(datos);
  return carta;
}
