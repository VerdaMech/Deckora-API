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

function parsearLinea(linea) {
  const match = linea.trim().match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)\s+(\S+)$/);
  if (!match) return null;
  return {
    cantidad: parseInt(match[1], 10),
    nombre: match[2].trim(),
    setCodigo: match[3].trim(),
    numeroColector: match[4].trim(),
  };
}

export async function importarLista(mazoId, jugadorId, lista) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);

  const lineas = lista.split('\n').map((l) => l.trim()).filter(Boolean);
  const importadas = [];
  const fallidas = [];

  for (const linea of lineas) {
    const parsed = parsearLinea(linea);
    if (!parsed) {
      fallidas.push({ linea, error: 'Formato no reconocido' });
      continue;
    }

    try {
      let carta = await cartasRepository.buscarPorSetYNumero(parsed.setCodigo, parsed.numeroColector);
      if (!carta) {
        const resultados = await cartasRepository.buscarPorNombre(parsed.nombre, 1);
        carta = resultados[0] ?? null;
      }

      if (!carta) {
        fallidas.push({ linea, error: `"${parsed.nombre}" no encontrada en la biblioteca` });
        continue;
      }

      await repo.agregarCarta(mazoId, carta.id, parsed.cantidad, false);
      importadas.push({ linea, nombre: carta.nombre, cantidad: parsed.cantidad });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        fallidas.push({ linea, error: `"${parsed.nombre}" ya está en el mazo` });
      } else {
        fallidas.push({ linea, error: err.message ?? 'Error al agregar la carta' });
      }
    }
  }

  return { importadas, fallidas };
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