import * as tiendasRepository from './tiendas.repository.js';

export function listarTodas() {
  return tiendasRepository.listarTodas();
}

export async function buscarCercanas() {
  // La geolocalización de tiendas fue eliminada (columnas latitud/longitud removidas de la tabla).
  return [];
}

export async function buscarPorId(id) {
  const tienda = await tiendasRepository.buscarPorId(id);
  if (!tienda) {
    const err = new Error('Tienda no encontrada');
    err.status = 404;
    throw err;
  }
  return tienda;
}

export async function actualizar(id, datos) {
  await tiendasRepository.actualizar(id, datos);
  return tiendasRepository.buscarPorId(id);
}

export function buscarTornesDeTienda(id) {
  return tiendasRepository.buscarTornesDeTienda(id);
}
