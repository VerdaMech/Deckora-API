export function validar(mazo) {
  const errores = [];
  const cartas = mazo.cartas ?? [];

  const totalCartas = cartas.reduce((sum, c) => sum + c.cantidad, 0);
  if (totalCartas !== 100) {
    errores.push(`El mazo Commander debe tener exactamente 100 cartas, actualmente tiene ${totalCartas}`);
  }

  const comandantes = cartas.filter((c) => c.es_comandante);
  if (comandantes.length !== 1) {
    errores.push(`El mazo Commander debe tener exactamente 1 comandante, actualmente tiene ${comandantes.length}`);
  } else {
    const cmd = comandantes[0];
    const tipo = cmd.tipo ?? '';
    if (!tipo.includes('Legendary') || !tipo.includes('Creature')) {
      errores.push(`El comandante "${cmd.nombre}" debe ser una Legendary Creature`);
    }
  }

  for (const carta of cartas) {
    if (!carta.es_tierra_basica && !carta.es_comandante && carta.cantidad > 1) {
      errores.push(`"${carta.nombre}" aparece ${carta.cantidad} veces; en Commander solo se permite 1 copia por carta`);
    }
  }

  return { valido: errores.length === 0, errores };
}