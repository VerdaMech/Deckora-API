import * as repo from './mazos.repository.js';
import { estrategias } from './estrategias/index.js';

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

export async function agregarCarta(mazoId, jugadorId, { carta_id, cantidad, es_comandante }) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);
  return repo.agregarCarta(mazoId, carta_id, cantidad, es_comandante);
}

export async function actualizarCarta(mazoId, cartaId, jugadorId, datos) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);
  await repo.actualizarCarta(mazoId, cartaId, datos);
  return repo.buscarPorId(mazoId);
}

export async function eliminarCarta(mazoId, cartaId, jugadorId) {
  const mazo = await repo.buscarPorId(mazoId);
  verificarPropietario(mazo, jugadorId);
  return repo.eliminarCarta(mazoId, cartaId);
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