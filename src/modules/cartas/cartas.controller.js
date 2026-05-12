import * as cartasService from './cartas.service.js';

export async function buscar(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'El parámetro q es requerido' });
    }
    const cartas = await cartasService.buscarEnBD(q);
    res.json(cartas);
  } catch (err) {
    next(err);
  }
}

export async function listar(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const resultado = await cartasService.listar({ page, limit });
    res.json({ total: resultado.count, cartas: resultado.rows });
  } catch (err) {
    next(err);
  }
}

export async function obtenerPorScryfallId(req, res, next) {
  try {
    const carta = await cartasService.obtenerPorScryfallId(req.params.scryfallId);
    res.json(carta);
  } catch (err) {
    next(err);
  }
}
