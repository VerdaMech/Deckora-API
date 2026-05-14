function agruparCommander(arr) {
  const n = arr.length;
  if (n < 3) return n > 0 ? [arr.map((j) => j.id)] : [];

  // Encuentra la combinación óptima de mesas de 3 y 4:
  // n % 3 == 0 → todas de 3 | n % 3 == 1 → una de 4, resto de 3
  // n % 3 == 2 → dos de 4, resto de 3 (si n<8 no hay split válido)
  let num4, num3;
  if (n % 3 === 0) {
    num4 = 0; num3 = n / 3;
  } else if (n % 3 === 1) {
    num4 = 1; num3 = (n - 4) / 3;
  } else {
    if (n < 8) return [arr.map((j) => j.id)];
    num4 = 2; num3 = (n - 8) / 3;
  }

  const mesas = [];
  let i = 0;
  for (let k = 0; k < num4; k++, i += 4) {
    mesas.push(arr.slice(i, i + 4).map((j) => j.id));
  }
  for (let k = 0; k < num3; k++, i += 3) {
    mesas.push(arr.slice(i, i + 3).map((j) => j.id));
  }
  return mesas;
}

export function emparejar(inscripciones, asignaciones = [], formato) {
  if (asignaciones && asignaciones.length > 0) {
    return asignaciones.map((mesa) => mesa.inscripcion_ids);
  }

  const ordenadas = [...inscripciones].sort(
    (a, b) => b.puntos_acumulados - a.puntos_acumulados
  );

  if (formato === 'COMMANDER') {
    return agruparCommander(ordenadas);
  }

  // Otros formatos: bracket 1v1 (top vs bottom)
  const mesas = [];
  const mitad = Math.floor(ordenadas.length / 2);
  for (let i = 0; i < mitad; i++) {
    mesas.push([ordenadas[i].id, ordenadas[ordenadas.length - 1 - i].id]);
  }
  return mesas;
}
