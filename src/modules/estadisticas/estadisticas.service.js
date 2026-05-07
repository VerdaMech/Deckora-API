import * as repo from './estadisticas.repository.js';

export async function obtenerMias(jugadorId) {
  const estadistica = await repo.buscarPorJugador(jugadorId);

  if (!estadistica) {
    return {
      usuario_id: jugadorId,
      partidas_ganadas: 0,
      partidas_perdidas: 0,
      partidas_empatadas: 0,
      torneos_participados: 0,
      total_partidas: 0,
      porcentaje_victorias: '0.0',
    };
  }

  const total =
    estadistica.partidas_ganadas +
    estadistica.partidas_perdidas +
    estadistica.partidas_empatadas;

  const porcentaje =
    total === 0
      ? '0.0'
      : ((estadistica.partidas_ganadas / total) * 100).toFixed(1);

  return {
    ...estadistica.toJSON(),
    total_partidas: total,
    porcentaje_victorias: porcentaje,
  };
}

export async function obtenerPublico(jugadorId) {
  const estadistica = await repo.buscarPorJugadorPublico(jugadorId);

  if (!estadistica) {
    return {
      usuario_id: jugadorId,
      partidas_ganadas: 0,
      partidas_perdidas: 0,
      partidas_empatadas: 0,
      torneos_participados: 0,
      total_partidas: 0,
      porcentaje_victorias: '0.0',
      Jugador: null,
    };
  }

  const total =
    estadistica.partidas_ganadas +
    estadistica.partidas_perdidas +
    estadistica.partidas_empatadas;

  const porcentaje =
    total === 0
      ? '0.0'
      : ((estadistica.partidas_ganadas / total) * 100).toFixed(1);

  return {
    ...estadistica.toJSON(),
    total_partidas: total,
    porcentaje_victorias: porcentaje,
  };
}

export async function obtenerRanking() {
  const estadisticas = await repo.obtenerRanking();

  const conPuntos = estadisticas.map((e) => {
    const data = e.toJSON();
    const puntos_totales =
      data.partidas_ganadas * 3 + data.partidas_empatadas * 1;
    return { ...data, puntos_totales };
  });

  conPuntos.sort((a, b) => {
    if (b.puntos_totales !== a.puntos_totales)
      return b.puntos_totales - a.puntos_totales;
    return b.partidas_ganadas - a.partidas_ganadas;
  });

  return conPuntos.map((e, i) => ({ ...e, posicion: i + 1 }));
}
