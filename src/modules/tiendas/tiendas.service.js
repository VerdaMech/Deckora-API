import { calcularDistancia } from '../../utils/haversine.js';
import * as tiendasRepository from './tiendas.repository.js';

export function listarTodas() {
  return tiendasRepository.listarTodas();
}

export async function buscarCercanas({ lat, lng, radio }) {
  const tiendas = await tiendasRepository.listarTodas();

  const conDistancia = tiendas
    .filter((t) => t.latitud != null && t.longitud != null)
    .map((t) => ({
      ...t.toJSON(),
      distancia_km: calcularDistancia(lat, lng, t.latitud, t.longitud),
    }))
    .filter((t) => t.distancia_km <= radio)
    .sort((a, b) => a.distancia_km - b.distancia_km);

  return conDistancia;
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
