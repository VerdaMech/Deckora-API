import * as repo from './mazos.repository.js';
import { estrategias } from './estrategias/index.js';
import * as cartasRepository from '../cartas/cartas.repository.js';

function generarSlug(nombre) {
  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${base}-${Date.now()}`;
}

function verificarPropietario(mazo, jugadorId) {
  if (!mazo) {
    const error = new Error('Mazo no encontrado');
    error.status = 404;
    throw error;
  }
  if (mazo.usuario_id !== jugadorId) {
    const error = new Error('No tienes permiso para acceder a este mazo');
    error.status = 403;
    throw error;
  }
}

export function listar(jugadorId) {
  return repo.listarPorJugador(jugadorId);
}

export async function crear(jugadorId, datos) {
  const slug = generarSlug(datos.nombre);
  return repo.crear({ ...datos, usuario_id: jugadorId, slug });
}

export async function obtenerPorId(id, jugadorId) {
  const mazo = await repo.buscarPorId(id);
  verificarPropietario(mazo, jugadorId);
  return mazo;
}

function resolverCarta(scryfallId) {
  return cartasRepository.buscarPorScryfallId(scryfallId).then((carta) => {
    if (!carta) {
      const err = new Error(`Carta con scryfall_id '${scryfallId}' no existe en la base de datos`);
      err.status = 404;
      throw err;
    }
    return carta;
  });
}

export async function agregarCarta(mazoId, jugadorId, { scryfall_id, cantidad, es_comandante }) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);
  const carta = await resolverCarta(scryfall_id);
  return repo.agregarCarta(mazoId, carta.id, cantidad, es_comandante);
}

export async function actualizarCarta(mazoId, scryfallId, jugadorId, datos) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);
  const carta = await resolverCarta(scryfallId);
  await repo.actualizarCarta(mazoId, carta.id, datos);
  return repo.buscarPorId(mazoId);
}

export async function eliminarCarta(mazoId, scryfallId, jugadorId) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);
  const carta = await resolverCarta(scryfallId);
  return repo.eliminarCarta(mazoId, carta.id);
}

export async function validar(mazoId, jugadorId) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);

  const estrategia = estrategias[mazo.formato];
  if (!estrategia) {
    const error = new Error(`Formato desconocido: ${mazo.formato}`);
    error.status = 400;
    throw error;
  }

  const cartasPlanas = (mazo.MazoCartas ?? []).map((mc) => ({
    nombre: mc.Carta?.nombre,
    tipo: mc.Carta?.tipo,
    costo_mana: mc.Carta?.costo_mana,
    es_tierra_basica: mc.Carta?.es_tierra_basica ?? false,
    cantidad: mc.cantidad,
    es_comandante: mc.es_comandante,
  }));

  return estrategia({ formato: mazo.formato, cartas: cartasPlanas });
}