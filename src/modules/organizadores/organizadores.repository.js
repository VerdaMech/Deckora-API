import { Organizador } from '../../models/index.js';

export function buscarPorId(usuarioId) {
  return Organizador.findOne({ where: { usuario_id: usuarioId } });
}

export function actualizar(usuarioId, datos) {
  return Organizador.update(datos, { where: { usuario_id: usuarioId } });
}
