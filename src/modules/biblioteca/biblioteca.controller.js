import * as bibliotecaService from './biblioteca.service.js';
import { listarCartasSchema } from './biblioteca.schema.js';

export async function listarCartas(req, res, next) {
  try {
    const params = listarCartasSchema.parse(req.query);
    const result = await bibliotecaService.listarCartas(params);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listarSets(req, res, next) {
  try {
    const result = await bibliotecaService.listarSets();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
