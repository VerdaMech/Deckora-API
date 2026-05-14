export function emparejar(inscripciones, asignaciones = []) {
  if (asignaciones && asignaciones.length > 0) {
    return asignaciones.map((mesa) => mesa.inscripcion_ids);
  }

  // Auto-bracket: top 1 vs último, top 2 vs penúltimo, etc.
  const ordenadas = [...inscripciones].sort(
    (a, b) => b.puntos_acumulados - a.puntos_acumulados
  );
  const mesas = [];
  const mitad = Math.floor(ordenadas.length / 2);
  for (let i = 0; i < mitad; i++) {
    mesas.push([ordenadas[i].id, ordenadas[ordenadas.length - 1 - i].id]);
  }
  return mesas;
}
