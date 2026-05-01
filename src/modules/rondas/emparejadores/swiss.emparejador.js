export function emparejar(inscripciones, asignaciones = []) {
  const ordenadas = [...inscripciones].sort(
    (a, b) => b.puntos_acumulados - a.puntos_acumulados
  );

  const mesas = [];
  for (let i = 0; i < ordenadas.length; i += 4) {
    mesas.push(ordenadas.slice(i, i + 4).map((insc) => insc.id));
  }

  return mesas;
}
