import * as tiendasService from './tiendas.service.js';
import { actualizarTiendaSchema, cercanaQuerySchema } from './tiendas.schema.js';

export async function listar(req, res, next) {
  try {
    const tiendas = await tiendasService.listarTodas();
    res.json(tiendas);
  } catch (err) {
    next(err);
  }
}

export async function cercanas(req, res, next) {
  try {
    const resultado = cercanaQuerySchema.safeParse(req.query);
    if (!resultado.success) {
      return res.status(400).json({ error: 'Parámetros inválidos', detalles: resultado.error.errors });
    }
    const tiendas = await tiendasService.buscarCercanas(resultado.data);
    res.json(tiendas);
  } catch (err) {
    next(err);
  }
}

export async function obtenerPorId(req, res, next) {
  try {
    const tienda = await tiendasService.buscarPorId(req.params.id);
    res.json(tienda);
  } catch (err) {
    next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    if (req.usuario.id !== req.params.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta tienda' });
    }

    const resultado = actualizarTiendaSchema.safeParse(req.body);
    if (!resultado.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: resultado.error.errors });
    }

    const tienda = await tiendasService.actualizar(req.params.id, resultado.data);
    res.json(tienda);
  } catch (err) {
    next(err);
  }
}

export async function obtenerTorneos(req, res, next) {
  try {
    const torneos = await tiendasService.buscarTornesDeTienda(req.params.id);
    res.json(torneos);
  } catch (err) {
    next(err);
  }
}
