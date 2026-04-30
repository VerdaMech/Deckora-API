import * as enfrentamientosService from './enfrentamientos.service.js';

export async function obtenerEnfrentamiento(req, res, next) {
  try {
    const enfrentamiento = await enfrentamientosService.obtenerEnfrentamiento(req.params.id);
    res.json(enfrentamiento);
  } catch (err) {
    next(err);
  }
}

export async function registrarResultado(req, res, next) {
  try {
    const enfrentamiento = await enfrentamientosService.registrarResultado(
      req.params.id,
      req.body,
      req.usuario.id
    );
    res.json(enfrentamiento);
  } catch (err) {
    next(err);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const enfrentamiento = await enfrentamientosService.cambiarEstado(
      req.params.id,
      req.body,
      req.usuario.id
    );
    res.json(enfrentamiento);
  } catch (err) {
    next(err);
  }
}
