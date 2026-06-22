import { describe, it, expect } from 'vitest';
import { emparejar } from '../../../src/modules/rondas/emparejadores/aleatorio.emparejador.js';

function inscripciones(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => ({ id: `insc-${i + 1}` }));
}

describe('aleatorio.emparejador — emparejar()', () => {
  // ─── Formato 1v1 ────────────────────────────────────────────────────────────

  it('TC-ALE-001: 2 inscripciones Standard genera 1 mesa de 2', () => {
    const resultado = emparejar(inscripciones(2), [], 'STANDARD');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toHaveLength(2);
  });

  it('TC-ALE-002: 4 inscripciones Standard genera 2 mesas de 2', () => {
    const resultado = emparejar(inscripciones(4), [], 'STANDARD');
    expect(resultado).toHaveLength(2);
    expect(resultado.every((m) => m.length === 2)).toBe(true);
  });

  it('TC-ALE-003: 6 inscripciones Standard genera 3 mesas de 2', () => {
    const resultado = emparejar(inscripciones(6), [], 'STANDARD');
    expect(resultado).toHaveLength(3);
    expect(resultado.every((m) => m.length === 2)).toBe(true);
  });

  it('TC-ALE-004: 3 inscripciones Standard genera 2 mesas (2 y 1)', () => {
    const resultado = emparejar(inscripciones(3), [], 'STANDARD');
    expect(resultado).toHaveLength(2);
    const tamanos = resultado.map((m) => m.length).sort((a, b) => b - a);
    expect(tamanos).toEqual([2, 1]);
  });

  // ─── Formato Commander ───────────────────────────────────────────────────────

  it('TC-ALE-005: 4 inscripciones COMMANDER genera 1 mesa de 4', () => {
    const resultado = emparejar(inscripciones(4), [], 'COMMANDER');
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toHaveLength(4);
  });

  it('TC-ALE-006: 8 inscripciones COMMANDER genera 2 mesas de 4', () => {
    const resultado = emparejar(inscripciones(8), [], 'COMMANDER');
    expect(resultado).toHaveLength(2);
    expect(resultado.every((m) => m.length === 4)).toBe(true);
  });

  // ─── Invariantes ────────────────────────────────────────────────────────────

  it('TC-ALE-007: 0 inscripciones devuelve array vacío', () => {
    const resultado = emparejar([], [], 'STANDARD');
    expect(resultado).toHaveLength(0);
  });

  it('TC-ALE-008: todos los IDs de entrada aparecen en el resultado (shuffle sin pérdida)', () => {
    const inscs = inscripciones(6);
    const idsEntrada = inscs.map((i) => i.id).sort();
    const resultado = emparejar(inscs, [], 'STANDARD');
    const idsSalida = resultado.flat().sort();
    expect(idsSalida).toEqual(idsEntrada);
  });

  it('TC-ALE-009: el resultado contiene IDs como strings, no objetos', () => {
    const resultado = emparejar(inscripciones(2), [], 'STANDARD');
    expect(typeof resultado[0][0]).toBe('string');
  });
});
