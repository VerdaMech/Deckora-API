import * as usuariosService from './usuarios.service.js';

export async function obtenerPorUsername(req, res, next) {
  try {
    const perfil = await usuariosService.obtenerPorUsername(req.params.username);
    res.json(perfil);
  } catch (err) {
    next(err);
  }
}
