export function emparejar(inscripciones, asignaciones = []) {
  if (!asignaciones || asignaciones.length === 0) {
    const err = new Error(
      'El emparejamiento manual requiere especificar las asignaciones de mesas'
    );
    err.status = 400;
    throw err;
  }

  return asignaciones.map((mesa) => mesa.inscripcion_ids);
}
