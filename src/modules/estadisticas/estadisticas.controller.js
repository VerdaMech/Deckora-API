import * as estadisticasService from './estadisticas.service.js';

export async function obtenerMias(req, res, next) {
  try {
    const estadisticas = await estadisticasService.obtenerMias(req.usuario.id);
    res.json(estadisticas);
  } catch (err) {
    next(err);
  }
}

export async function obtenerPublico(req, res, next) {
  try {
    const estadisticas = await estadisticasService.obtenerPublico(
      req.params.jugadorId,
    );
    res.json(estadisticas);
  } catch (err) {
    next(err);
  }
}

export async function obtenerHistorialDiario(req, res, next) {
  try {
    const { jugadorId } = req.params;
    const { mes } = req.query;
    const historial = await estadisticasService.obtenerHistorialDiario(jugadorId, mes);
    res.json(historial);
  } catch (err) {
    next(err);
  }
}

export async function obtenerRanking(req, res, next) {
  try {
    const ranking = await estadisticasService.obtenerRanking();
    res.json(ranking);
  } catch (err) {
    next(err);
  }
}
