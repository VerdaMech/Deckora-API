import { Carta } from '../../models/index.js';
import * as repo from './colecciones.repository.js';

export async function obtenerMiColeccion(jugadorId) {
  const coleccion = await repo.obtenerColeccionCompleta(jugadorId);
  if (!coleccion) {
    return { cartas: [] };
  }
  return coleccion;
}

export async function agregarCarta(jugadorId, { scryfall_id, cantidad, es_foil }) {
  const carta = await Carta.findOne({ where: { scryfall_id } });
  if (!carta) {
    const error = new Error('Carta no encontrada. Búscala primero en /api/cartas/:scryfallId para importarla');
    error.status = 404;
    throw error;
  }

  const [coleccion] = await repo.obtenerOCrearColeccion(jugadorId);
  return repo.agregarOActualizarCarta(coleccion.id, carta.id, cantidad, es_foil);
}

export async function actualizarCantidad(jugadorId, cartaId, { cantidad, es_foil }) {
  const [coleccion] = await repo.obtenerOCrearColeccion(jugadorId);
  const registro = await repo.actualizarCantidad(coleccion.id, cartaId, es_foil, cantidad);
  if (!registro) {
    const error = new Error('Carta no encontrada en la colección');
    error.status = 404;
    throw error;
  }
  return registro;
}

export async function eliminarCarta(jugadorId, cartaId, esFoil) {
  const [coleccion] = await repo.obtenerOCrearColeccion(jugadorId);
  const eliminados = await repo.eliminarCarta(coleccion.id, cartaId, esFoil);
  if (!eliminados) {
    const error = new Error('Carta no encontrada en la colección');
    error.status = 404;
    throw error;
  }
}