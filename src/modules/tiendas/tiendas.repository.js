import { Tienda, Usuario, Torneo } from '../../models/index.js';

export function listarTodas() {
  return Tienda.findAll({
    include: [{ model: Usuario, where: { activo: true }, attributes: ['id', 'nombre_usuario', 'correo'] }],
  });
}

export function buscarPorId(id) {
  return Tienda.findOne({
    where: { usuario_id: id },
    include: [{ model: Usuario, attributes: ['id', 'nombre_usuario', 'correo'] }],
  });
}

export function actualizar(id, datos) {
  return Tienda.update(datos, { where: { usuario_id: id } });
}

export function buscarTornesDeTienda(id) {
  return Torneo.findAll({ where: { organizador_id: id } });
}
