function agruparCommander(arr) {
  const n = arr.length;
  if (n < 3) return n > 0 ? [arr.map((j) => j.id)] : [];

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
  const ordenadas = [...inscripciones].sort(
    (a, b) => b.puntos_acumulados - a.puntos_acumulados
  );

  if (formato === 'COMMANDER') {
    return agruparCommander(ordenadas);
  }

  // Otros formatos: Swiss 1v1 (por ranking consecutivo)
  const mesas = [];
  for (let i = 0; i < ordenadas.length; i += 2) {
    mesas.push(ordenadas.slice(i, i + 2).map((insc) => insc.id));
  }
  return mesas;
}
