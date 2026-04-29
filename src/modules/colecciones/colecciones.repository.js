import { Coleccion, ColeccionCarta, Carta } from '../../models/index.js';

export function obtenerOCrearColeccion(jugadorId) {
  return Coleccion.findOrCreate({
    where: { usuario_id: jugadorId },
    defaults: { nombre: 'Mi Colección', usuario_id: jugadorId },
  });
}

export function obtenerColeccionCompleta(jugadorId) {
  return Coleccion.findOne({
    where: { usuario_id: jugadorId },
    include: [
      {
        model: ColeccionCarta,
        include: [{ model: Carta }],
      },
    ],
    order: [[ColeccionCarta, Carta, 'nombre', 'ASC']],
  });
}

export async function agregarOActualizarCarta(coleccionId, cartaId, cantidad, esFoil) {
  const [registro, creado] = await ColeccionCarta.findOrCreate({
    where: { coleccion_id: coleccionId, carta_id: cartaId, es_foil: esFoil },
    defaults: { cantidad },
  });
  if (!creado) {
    await registro.increment('cantidad', { by: cantidad });
    await registro.reload();
  }
  return registro;
}

export async function actualizarCantidad(coleccionId, cartaId, esFoil, cantidad) {
  await ColeccionCarta.update(
    { cantidad },
    { where: { coleccion_id: coleccionId, carta_id: cartaId, es_foil: esFoil } },
  );
  return ColeccionCarta.findOne({
    where: { coleccion_id: coleccionId, carta_id: cartaId, es_foil: esFoil },
  });
}

export function eliminarCarta(coleccionId, cartaId, esFoil) {
  return ColeccionCarta.destroy({
    where: { coleccion_id: coleccionId, carta_id: cartaId, es_foil: esFoil },
  });
}