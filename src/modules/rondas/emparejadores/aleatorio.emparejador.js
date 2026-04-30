export function emparejar(inscripciones, asignaciones = []) {
  const arr = [...inscripciones];

  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  const mesas = [];
  for (let i = 0; i < arr.length; i += 4) {
    mesas.push(arr.slice(i, i + 4).map((insc) => insc.id));
  }

  return mesas;
}
