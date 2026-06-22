import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JUGADOR_TEST } from '../fixtures/usuarios.fixture.js';

// ─── Mocks de dependencias del service ───────────────────────────────────────

vi.mock('../../src/modules/estadisticas/estadisticas.repository.js', () => ({
  buscarPorJugador: vi.fn(),
  buscarPorJugadorPublico: vi.fn(),
  buscarHistorialMeses: vi.fn(),
  buscarHistorialDias: vi.fn(),
  buscarMazoMasJugado: vi.fn(),
  obtenerRanking: vi.fn(),
}));

const repo = await import('../../src/modules/estadisticas/estadisticas.repository.js');
const service = await import('../../src/modules/estadisticas/estadisticas.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('estadisticas.service — obtenerMias', () => {
  it('TC-EST-001: devuelve valores por defecto cuando no hay estadisticas', async () => {
    repo.buscarPorJugador.mockResolvedValue(null);

    const res = await service.obtenerMias(JUGADOR_TEST.id);

    expect(res).toEqual({
      usuario_id: JUGADOR_TEST.id,
      partidas_ganadas: 0,
      partidas_perdidas: 0,
      partidas_empatadas: 0,
      torneos_participados: 0,
      total_partidas: 0,
      porcentaje_victorias: '0.0',
    });
  });

  it('TC-EST-002: calcula total_partidas y porcentaje_victorias correctamente', async () => {
    repo.buscarPorJugador.mockResolvedValue({
      partidas_ganadas: 7,
      partidas_perdidas: 2,
      partidas_empatadas: 1,
      torneos_participados: 3,
      toJSON: () => ({
        usuario_id: JUGADOR_TEST.id,
        partidas_ganadas: 7,
        partidas_perdidas: 2,
        partidas_empatadas: 1,
        torneos_participados: 3,
      }),
    });

    const res = await service.obtenerMias(JUGADOR_TEST.id);

    expect(res.total_partidas).toBe(10);
    expect(res.porcentaje_victorias).toBe('70.0');
  });

  it('TC-EST-003: porcentaje_victorias es 0.0 cuando total es cero', async () => {
    repo.buscarPorJugador.mockResolvedValue({
      partidas_ganadas: 0,
      partidas_perdidas: 0,
      partidas_empatadas: 0,
      torneos_participados: 0,
      toJSON: () => ({
        usuario_id: JUGADOR_TEST.id,
        partidas_ganadas: 0,
        partidas_perdidas: 0,
        partidas_empatadas: 0,
        torneos_participados: 0,
      }),
    });

    const res = await service.obtenerMias(JUGADOR_TEST.id);

    expect(res.total_partidas).toBe(0);
    expect(res.porcentaje_victorias).toBe('0.0');
  });
});

describe('estadisticas.service — obtenerPublico', () => {
  it('TC-EST-004: devuelve valores por defecto cuando no hay estadisticas publicas', async () => {
    repo.buscarPorJugadorPublico.mockResolvedValue(null);
    repo.buscarHistorialMeses.mockResolvedValue([]);
    repo.buscarMazoMasJugado.mockResolvedValue([]);

    const res = await service.obtenerPublico(JUGADOR_TEST.id);

    expect(res).toEqual({
      usuario_id: JUGADOR_TEST.id,
      partidas_ganadas: 0,
      partidas_perdidas: 0,
      partidas_empatadas: 0,
      torneos_participados: 0,
      total_partidas: 0,
      porcentaje_victorias: '0.0',
      Jugador: null,
      historialUltimosMeses: [],
    });
  });

  it('TC-EST-005: calcula y fusiona historial y mazo mas jugado', async () => {
    repo.buscarPorJugadorPublico.mockResolvedValue({
      partidas_ganadas: 5,
      partidas_perdidas: 3,
      partidas_empatadas: 2,
      torneos_participados: 4,
      toJSON: () => ({
        usuario_id: JUGADOR_TEST.id,
        partidas_ganadas: 5,
        partidas_perdidas: 3,
        partidas_empatadas: 2,
        torneos_participados: 4,
        Jugador: { formato_preferido: 'COMMANDER' },
      }),
    });
    repo.buscarHistorialMeses.mockResolvedValue([
      { mes: 'Jan', mes_key: '2025-01', ganadas: 3, perdidas: 1 },
    ]);
    repo.buscarMazoMasJugado.mockResolvedValue([
      { id: 'm1', nombre: 'Dragon Deck', veces: 5 },
    ]);

    const res = await service.obtenerPublico(JUGADOR_TEST.id);

    expect(res.total_partidas).toBe(10);
    expect(res.porcentaje_victorias).toBe('50.0');
    expect(res.historialUltimosMeses).toHaveLength(1);
    expect(res.mazoMasJugado).toEqual({ id: 'm1', nombre: 'Dragon Deck', veces: 5 });
  });
});

describe('estadisticas.service — obtenerHistorialDiario', () => {
  it('TC-EST-006: delega al repositorio con jugadorId y mesKey', async () => {
    const historial = [{ dia: '01', ganadas: 2, perdidas: 1 }];
    repo.buscarHistorialDias.mockResolvedValue(historial);

    const res = await service.obtenerHistorialDiario(JUGADOR_TEST.id, '2025-01');

    expect(res).toEqual(historial);
    expect(repo.buscarHistorialDias).toHaveBeenCalledWith(JUGADOR_TEST.id, '2025-01');
  });
});

describe('estadisticas.service — obtenerRanking', () => {
  it('TC-EST-007: ordena por puntos_totales descendente y asigna posicion', async () => {
    repo.obtenerRanking.mockResolvedValue([
      {
        toJSON: () => ({
          usuario_id: 'u1',
          partidas_ganadas: 2,
          partidas_empatadas: 1,
          partidas_perdidas: 5,
        }),
      },
      {
        toJSON: () => ({
          usuario_id: 'u2',
          partidas_ganadas: 5,
          partidas_empatadas: 0,
          partidas_perdidas: 3,
        }),
      },
      {
        toJSON: () => ({
          usuario_id: 'u3',
          partidas_ganadas: 3,
          partidas_empatadas: 3,
          partidas_perdidas: 2,
        }),
      },
    ]);

    const res = await service.obtenerRanking();

    // u2: 5*3 + 0 = 15 puntos -> posicion 1
    // u3: 3*3 + 3 = 12 puntos -> posicion 2
    // u1: 2*3 + 1 =  7 puntos -> posicion 3
    expect(res).toHaveLength(3);
    expect(res[0].usuario_id).toBe('u2');
    expect(res[0].puntos_totales).toBe(15);
    expect(res[0].posicion).toBe(1);

    expect(res[1].usuario_id).toBe('u3');
    expect(res[1].puntos_totales).toBe(12);
    expect(res[1].posicion).toBe(2);

    expect(res[2].usuario_id).toBe('u1');
    expect(res[2].puntos_totales).toBe(7);
    expect(res[2].posicion).toBe(3);
  });

  it('TC-EST-008: desempate por partidas_ganadas cuando puntos son iguales', async () => {
    repo.obtenerRanking.mockResolvedValue([
      {
        toJSON: () => ({
          usuario_id: 'a',
          partidas_ganadas: 1,
          partidas_empatadas: 6,
          partidas_perdidas: 0,
        }),
      },
      {
        toJSON: () => ({
          usuario_id: 'b',
          partidas_ganadas: 3,
          partidas_empatadas: 0,
          partidas_perdidas: 4,
        }),
      },
    ]);

    const res = await service.obtenerRanking();

    // a: 1*3 + 6 = 9 puntos, 1 ganada
    // b: 3*3 + 0 = 9 puntos, 3 ganadas -> b va primero
    expect(res[0].usuario_id).toBe('b');
    expect(res[0].posicion).toBe(1);
    expect(res[1].usuario_id).toBe('a');
    expect(res[1].posicion).toBe(2);
  });
});
