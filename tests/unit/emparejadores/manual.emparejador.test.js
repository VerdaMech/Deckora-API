import { describe, it, expect } from 'vitest';
import { emparejar } from '../../../src/modules/rondas/emparejadores/manual.emparejador.js';

function inscripciones(cantidad, puntos = []) {
  return Array.from({ length: cantidad }, (_, i) => ({
    id: `insc-${i + 1}`,
    puntos_acumulados: puntos[i] ?? 0,
  }));
}

describe('manual.emparejador — emparejar()', () => {
  // ─── Asignaciones manuales ───────────────────────────────────────────────────

  it('TC-MAN-001: con asignaciones retorna exactamente las inscripcion_ids de cada mesa', () => {
    const asignaciones = [
      { inscripcion_ids: ['insc-1', 'insc-2'] },
      { inscripcion_ids: ['insc-3', 'insc-4'] },
    ];
    const resultado = emparejar(inscripciones(4), asignaciones, 'STANDARD');
    expect(resultado).toEqual([['insc-1', 'insc-2'], ['insc-3', 'insc-4']]);
  });

  it('TC-MAN-002: con una sola mesa asignada la retorna directamente', () => {
    const asignaciones = [{ inscripcion_ids: ['insc-1', 'insc-2', 'insc-3', 'insc-4'] }];
    const resultado = emparejar(inscripciones(4), asignaciones, 'COMMANDER');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toEqual(['insc-1', 'insc-2', 'insc-3', 'insc-4']);
  });

  // ─── Sin asignaciones: comportamiento automático (bracket por puntos) ────────

  it('TC-MAN-003: asignaciones vacías con 4 jugadores Standard genera bracket top vs bottom', () => {
    const inscs = [
      { id: 'id-0pts', puntos_acumulados: 0 },
      { id: 'id-9pts', puntos_acumulados: 9 },
      { id: 'id-3pts', puntos_acumulados: 3 },
      { id: 'id-6pts', puntos_acumulados: 6 },
    ];
    const resultado = emparejar(inscs, [], 'STANDARD');
    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toEqual(['id-9pts', 'id-0pts']);
    expect(resultado[1]).toEqual(['id-6pts', 'id-3pts']);
  });

  it('TC-MAN-004: asignaciones vacías con 6 jugadores COMMANDER genera 2 mesas de 3', () => {
    const resultado = emparejar(inscripciones(6), [], 'COMMANDER');
    expect(resultado).toHaveLength(2);
    expect(resultado.every((m) => m.length === 3)).toBe(true);
  });

  it('TC-MAN-005: asignaciones vacías con 7 jugadores COMMANDER genera mesas de 4 y 3', () => {
    const resultado = emparejar(inscripciones(7), [], 'COMMANDER');
    expect(resultado).toHaveLength(2);
    const tamanos = resultado.map((m) => m.length).sort((a, b) => b - a);
    expect(tamanos).toEqual([4, 3]);
  });

  it('TC-MAN-006: asignaciones vacías con 0 jugadores devuelve array vacío', () => {
    const resultado = emparejar([], [], 'STANDARD');
    expect(resultado).toHaveLength(0);
  });

  it('TC-MAN-007: asignaciones null cae al comportamiento automático', () => {
    const resultado = emparejar(inscripciones(4), null, 'STANDARD');
    expect(resultado).toHaveLength(2);
    expect(resultado.every((m) => m.length === 2)).toBe(true);
  });

  it('TC-MAN-008: sin asignaciones ordena por puntos antes de emparejar', () => {
    const inscs = [
      { id: 'bajo', puntos_acumulados: 0 },
      { id: 'alto', puntos_acumulados: 9 },
    ];
    const resultado = emparejar(inscs, [], 'STANDARD');
    expect(resultado[0]).toEqual(['alto', 'bajo']);
  });
});
