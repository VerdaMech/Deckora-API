import * as torneosService from './torneos.service.js';

export async function listar(req, res, next) {
  try {
    const torneos = await torneosService.listar();
    res.json(torneos);
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    if (req.usuario.rol !== 'organizador' && req.usuario.rol !== 'tienda') {
      return res.status(403).json({ error: 'Acceso denegado: se requiere rol organizador o tienda' });
    }
    const torneo = await torneosService.crear(req.usuario.id, req.body);
    res.status(201).json(torneo);
  } catch (err) {
    next(err);
  }
}

export async function obtenerPorId(req, res, next) {
  try {
    const torneo = await torneosService.obtenerPorId(req.params.id);
    res.json(torneo);
  } catch (err) {
    next(err);
  }
}

export async function inscribir(req, res, next) {
  try {
    const inscripcion = await torneosService.inscribir(
      req.params.id,
      req.usuario.id,
      req.body.mazo_id,
    );
    res.status(201).json(inscripcion);
  } catch (err) {
    next(err);
  }
}

export async function listarInscripciones(req, res, next) {
  try {
    const inscripciones = await torneosService.listarInscripciones(req.params.id);
    res.json(inscripciones);
  } catch (err) {
    next(err);
  }
}