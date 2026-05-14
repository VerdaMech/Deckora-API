export function emparejar(inscripciones, asignaciones = [], formato) {
  const arr = [...inscripciones];

  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  const tamano = formato === 'COMMANDER' ? 4 : 2;
  const mesas = [];
  for (let i = 0; i < arr.length; i += tamano) {
    mesas.push(arr.slice(i, i + tamano).map((insc) => insc.id));
  }
  return mesas;
}
