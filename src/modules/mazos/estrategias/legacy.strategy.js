export function validar(mazo) {
  const errores = [];
  const cartas = mazo.cartas ?? [];

  const totalCartas = cartas.reduce((sum, c) => sum + c.cantidad, 0);
  if (totalCartas < 60) {
    errores.push(`El mazo Legacy debe tener mínimo 60 cartas, actualmente tiene ${totalCartas}`);
  }

  for (const carta of cartas) {
    if (!carta.es_tierra_basica && carta.cantidad > 4) {
      errores.push(`"${carta.nombre}" aparece ${carta.cantidad} veces; el máximo en Legacy es 4 copias por carta`);
    }
  }

  return { valido: errores.length === 0, errores };
}