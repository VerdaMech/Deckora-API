import { Torneo, Inscripcion, Mazo } from '../../models/index.js';

export async function misTorneos(jugadorId, limit) {
  const options = {
    include: [
      {
        model: Inscripcion,
        where: { usuario_id: jugadorId },
        required: true,
        attributes: [],
      },
    ],
    order: [['fecha', 'ASC']],
  };
  if (limit) options.limit = parseInt(limit, 10);
  return Torneo.findAll(options);
}

export async function misInscripciones(jugadorId) {
  const inscripciones = await Inscripcion.findAll({
    where: { usuario_id: jugadorId },
    include: [
      { model: Torneo },
      { model: Mazo, attributes: ['id', 'nombre', 'formato', 'slug'] },
    ],
    order: [['fecha_inscripcion', 'DESC']],
  });

  return inscripciones.map((ins) => {
    const data = ins.toJSON();
    return {
      inscripcion: {
        id: data.id,
        fecha_inscripcion: data.fecha_inscripcion,
        confirmado: data.confirmado,
        mazo: data.Mazo ?? null,
      },
      torneo: data.Torneo ?? null,
    };
  });
}
