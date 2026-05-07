import * as organizadoresService from './organizadores.service.js';
import { actualizarOrganizadorSchema } from './organizadores.schema.js';

export async function obtenerMio(req, res, next) {
  try {
    const organizador = await organizadoresService.obtenerMio(req.usuario.id);
    res.json(organizador);
  } catch (err) {
    next(err);
  }
}

export async function actualizarMio(req, res, next) {
  try {
    const resultado = actualizarOrganizadorSchema.safeParse(req.body);
    if (!resultado.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: resultado.error.errors });
    }
    const organizador = await organizadoresService.actualizarMio(req.usuario.id, resultado.data);
    res.json(organizador);
  } catch (err) {
    next(err);
  }
}
