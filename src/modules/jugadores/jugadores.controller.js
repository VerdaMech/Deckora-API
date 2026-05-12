import * as jugadoresService from './jugadores.service.js';
import * as mazosRepo from '../mazos/mazos.repository.js';

export async function misTorneos(req, res, next) {
  try {
    const torneos = await jugadoresService.misTorneos(req.usuario.id, req.query.limit);
    res.json(torneos);
  } catch (err) {
    next(err);
  }
}

export async function misInscripciones(req, res, next) {
  try {
    const inscripciones = await jugadoresService.misInscripciones(req.usuario.id);
    res.json(inscripciones);
  } catch (err) {
    next(err);
  }
}

export async function mazosPublicos(req, res, next) {
  try {
    const mazos = await mazosRepo.listarPublicosPorJugador(req.params.id);
    res.json(mazos);
  } catch (err) {
    next(err);
  }
}
