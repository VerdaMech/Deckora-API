import * as cartasRepository from './cartas.repository.js';

export async function buscarEnBD(q, formato = null) {
  return cartasRepository.buscarPorNombre(q, 20, formato);
}

export async function listar({ page, limit }) {
  return cartasRepository.listar({ page, limit });
}

export async function obtenerPorScryfallId(scryfallId) {
  const carta = await cartasRepository.buscarPorScryfallId(scryfallId);

  if (!carta) {
    const err = new Error('Carta no encontrada');
    err.status = 404;
    throw err;
  }

  return carta;
}
