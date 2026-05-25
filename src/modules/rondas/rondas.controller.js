import * as rondasService from './rondas.service.js';

export async function crearRonda(req, res, next) {
  try {
    const { torneoId } = req.params;
    const ronda = await rondasService.crearRonda(torneoId, req.body, req.usuario.id);
    res.status(201).json(ronda);
  } catch (err) {
    next(err);
  }
}

export async function listarRondas(req, res, next) {
  try {
    const { torneoId } = req.params;
    const rondas = await rondasService.listarRondasDeTorneo(torneoId);
    res.json(rondas);
  } catch (err) {
    next(err);
  }
}

export async function obtenerRonda(req, res, next) {
  try {
    const { rondaId } = req.params;
    const ronda = await rondasService.obtenerRonda(rondaId);
    res.json(ronda);
  } catch (err) {
    next(err);
  }
}

export async function eliminarRonda(req, res, next) {
  try {
    const { torneoId, rondaId } = req.params;
    await rondasService.eliminarRonda(torneoId, rondaId, req.usuario.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
