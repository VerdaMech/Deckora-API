import * as coleccionesService from './colecciones.service.js';

export async function miColeccion(req, res, next) {
  try {
    const coleccion = await coleccionesService.obtenerMiColeccion(req.usuario.id);
    res.json(coleccion);
  } catch (err) {
    next(err);
  }
}

export async function agregarCarta(req, res, next) {
  try {
    const registro = await coleccionesService.agregarCarta(req.usuario.id, req.body);
    res.status(201).json(registro);
  } catch (err) {
    next(err);
  }
}

export async function actualizarCarta(req, res, next) {
  try {
    const registro = await coleccionesService.actualizarCantidad(
      req.usuario.id,
      req.params.cartaId,
      req.body,
    );
    res.json(registro);
  } catch (err) {
    next(err);
  }
}

export async function eliminarCarta(req, res, next) {
  try {
    const esFoil = req.query.es_foil === 'true';
    await coleccionesService.eliminarCarta(req.usuario.id, req.params.cartaId, esFoil);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
