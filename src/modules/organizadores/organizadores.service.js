import * as repo from './organizadores.repository.js';

export async function obtenerMio(usuarioId) {
  const organizador = await repo.buscarPorId(usuarioId);
  if (!organizador) {
    const error = new Error('Perfil de organizador no encontrado');
    error.status = 404;
    throw error;
  }
  return organizador;
}

export async function actualizarMio(usuarioId, datos) {
  await repo.actualizar(usuarioId, datos);
  return repo.buscarPorId(usuarioId);
}
