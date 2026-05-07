import * as torneosService from './torneos.service.js';

export async function listar(req, res, next) {
  try {
    const { organizador_id } = req.query;
    const torneos = await torneosService.listar({ organizadorId: organizador_id });
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

export async function actualizar(req, res, next) {
  try {
    const torneo = await torneosService.actualizar(req.params.id, req.usuario.id, req.body);
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

export async function obtenerTablaPosiciones(req, res, next) {
  try {
    const tabla = await torneosService.obtenerTablaPosiciones(req.params.id);
    res.json(tabla);
  } catch (err) {
    next(err);
  }
}

export async function misTorneos(req, res, next) {
  try {
    const torneos = await torneosService.misTorneos(req.usuario.id);
    res.json(torneos);
  } catch (err) {
    next(err);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const torneo = await torneosService.cambiarEstado(req.params.id, req.usuario.id, req.body);
    res.json(torneo);
  } catch (err) {
    next(err);
  }
}

export async function cancelarInscripcion(req, res, next) {
  try {
    await torneosService.cancelarInscripcion(
      req.params.id,
      req.params.inscripcionId,
      req.usuario.id,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function cerrarTorneo(req, res, next) {
  try {
    const torneo = await torneosService.cerrarTorneo(
      req.params.id,
      req.usuario.id,
    );
    res.json(torneo);
  } catch (err) {
    next(err);
  }
}