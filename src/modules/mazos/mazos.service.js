import * as repo from './mazos.repository.js';
import { estrategias } from './estrategias/index.js';
import * as cartasRepository from '../cartas/cartas.repository.js';
import { generateExplanation } from '../../utils/openrouter.js';

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

async function resolverCarta(identificador) {
  let carta = await cartasRepository.buscarPorScryfallId(identificador);
  if (!carta) carta = await cartasRepository.buscarPorId(identificador);
  if (!carta) {
    const err = new Error(`Carta '${identificador}' no existe en la biblioteca local`);
    err.status = 404;
    throw err;
  }
  return carta;
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

export async function actualizar(mazoId, jugadorId, datos) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);
  const payload = { ...datos };
  if (datos.nombre) {
    payload.slug = generarSlug(datos.nombre);
  }
  return repo.actualizar(mazoId, payload);
}

export async function recomendarCartas(mazoId, jugadorId) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);

  const cartasConEmbedding = (mazo.MazoCartas ?? []).filter(
    (mc) => mc.Carta?.embedding != null,
  );

  if (cartasConEmbedding.length === 0) {
    const error = new Error('Las cartas del mazo aún no tienen embeddings generados');
    error.status = 422;
    throw error;
  }

  const embeddings = cartasConEmbedding.map((mc) => JSON.parse(mc.Carta.embedding));
  const dim = embeddings[0].length;
  const vectorPromedio = Array.from(
    { length: dim },
    (_, i) => embeddings.reduce((sum, e) => sum + e[i], 0) / embeddings.length,
  );

  const excluirIds = (mazo.MazoCartas ?? []).map((mc) => mc.carta_id);
  const recomendaciones = await repo.buscarRecomendaciones(
    vectorPromedio,
    excluirIds,
    mazo.formato,
  );

  let explicacion = null;
  if (recomendaciones.length > 0) {
    try {
      explicacion = await generateExplanation(mazo.nombre, mazo.formato, recomendaciones);
    } catch {
      // la explicación es opcional; si falla no se interrumpe el endpoint
    }
  }

  return { recomendaciones, explicacion };
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