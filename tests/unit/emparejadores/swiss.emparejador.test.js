import { describe, it, expect } from 'vitest';
import { emparejar } from '../../../src/modules/rondas/emparejadores/swiss.emparejador.js';

function inscripciones(cantidad, puntos = []) {
  return Array.from({ length: cantidad }, (_, i) => ({
    id: `insc-${i + 1}`,
    puntos_acumulados: puntos[i] ?? 0,
  }));
}

describe('swiss.emparejador — emparejar() @regression', () => {
  // ─── Formato 1v1 (Standard / Modern / Pioneer / Legacy) ─────────────────

  it('TC-SWI-001: 2 jugadores genera 1 mesa de 2', () => {
    const resultado = emparejar(inscripciones(2), [], 'STANDARD');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toHaveLength(2);
  });

  it('TC-SWI-002: 4 jugadores genera 2 mesas de 2', () => {
    const resultado = emparejar(inscripciones(4), [], 'STANDARD');
    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toHaveLength(2);
    expect(resultado[1]).toHaveLength(2);
  });

  it('TC-SWI-003: número impar de jugadores produce un bye (jugador solo)', () => {
    const resultado = emparejar(inscripciones(3), [], 'STANDARD');
    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toHaveLength(2);
    expect(resultado[1]).toHaveLength(1);
  });

  it('TC-SWI-004: jugadores se ordenan por puntos de mayor a menor antes de emparejar', () => {
    const inscs = [
      { id: 'id-0pts', puntos_acumulados: 0 },
      { id: 'id-9pts', puntos_acumulados: 9 },
      { id: 'id-3pts', puntos_acumulados: 3 },
      { id: 'id-6pts', puntos_acumulados: 6 },
    ];
    const resultado = emparejar(inscs, [], 'STANDARD');
    expect(resultado[0]).toEqual(['id-9pts', 'id-6pts']);
    expect(resultado[1]).toEqual(['id-3pts', 'id-0pts']);
  });

  // ─── Formato Commander (mesas de 3–4) ───────────────────────────────────

  it('TC-SWI-005: 3 jugadores Commander genera 1 mesa de 3', () => {
    const resultado = emparejar(inscripciones(3), [], 'COMMANDER');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toHaveLength(3);
  });

  it('TC-SWI-006: 4 jugadores Commander genera 1 mesa de 4', () => {
    const resultado = emparejar(inscripciones(4), [], 'COMMANDER');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toHaveLength(4);
  });

  it('TC-SWI-007: 6 jugadores Commander genera 2 mesas de 3', () => {
    const resultado = emparejar(inscripciones(6), [], 'COMMANDER');
    expect(resultado).toHaveLength(2);
    expect(resultado.every((mesa) => mesa.length === 3)).toBe(true);
  });

  it('TC-SWI-008: 7 jugadores Commander genera 1 mesa de 4 y 1 de 3', () => {
    const resultado = emparejar(inscripciones(7), [], 'COMMANDER');
    expect(resultado).toHaveLength(2);
    const tamanos = resultado.map((m) => m.length).sort((a, b) => b - a);
    expect(tamanos).toEqual([4, 3]);
  });

  it('TC-SWI-009: 2 jugadores Commander (menos del mínimo) agrupa a ambos juntos', () => {
    const resultado = emparejar(inscripciones(2), [], 'COMMANDER');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toHaveLength(2);
  });

  it('TC-SWI-010: 0 jugadores Commander devuelve array vacío', () => {
    const resultado = emparejar([], [], 'COMMANDER');
    expect(resultado).toHaveLength(0);
  });
});
