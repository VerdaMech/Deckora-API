import * as mazosService from './mazos.service.js';

export async function listar(req, res, next) {
  try {
    const mazos = await mazosService.listar(req.usuario.id);
    res.json(mazos);
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const mazo = await mazosService.crear(req.usuario.id, req.body);
    res.status(201).json(mazo);
  } catch (err) {
    next(err);
  }
}

export async function obtenerPorId(req, res, next) {
  try {
    const mazo = await mazosService.obtenerPorId(req.params.id, req.usuario.id);
    res.json(mazo);
  } catch (err) {
    next(err);
  }
}

export async function agregarCarta(req, res, next) {
  try {
    const registro = await mazosService.agregarCarta(req.params.id, req.usuario.id, req.body);
    res.status(201).json(registro);
  } catch (err) {
    next(err);
  }
}

export async function actualizarCarta(req, res, next) {
  try {
    const mazo = await mazosService.actualizarCarta(
      req.params.id,
      req.params.cartaId,
      req.usuario.id,
      req.body,
    );
    res.json(mazo);
  } catch (err) {
    next(err);
  }
}

export async function eliminarCarta(req, res, next) {
  try {
    await mazosService.eliminarCarta(req.params.id, req.params.cartaId, req.usuario.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    const mazo = await mazosService.actualizar(req.params.id, req.usuario.id, req.body);
    res.json(mazo);
  } catch (err) {
    next(err);
  }
}

export async function importar(req, res, next) {
  try {
    const resultado = await mazosService.importarLista(req.params.id, req.usuario.id, req.body.lista);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function validar(req, res, next) {
  try {
    const resultado = await mazosService.validar(req.params.id, req.usuario.id);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function recomendarCartas(req, res, next) {
  try {
    const result = await mazosService.recomendarCartas(req.params.id, req.usuario.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}