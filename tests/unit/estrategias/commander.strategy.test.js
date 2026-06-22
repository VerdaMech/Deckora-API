import { describe, it, expect } from 'vitest';
import { validar } from '../../../src/modules/mazos/estrategias/commander.strategy.js';
import {
  COMMANDER_VALIDO,
  COMMANDER_99_CARTAS,
  COMMANDER_101_CARTAS,
  COMMANDER_SIN_COMANDANTE,
  COMMANDER_DOS_COMANDANTES,
  COMMANDER_NO_LEGENDARY_CREATURE,
  COMMANDER_CON_DUPLICADO,
  COMMANDER_TIERRAS_BASICAS_DUPLICADAS,
  COMMANDER_VACIO,
  COMMANDER_MULTIPLES_ERRORES,
} from '../../fixtures/mazos.fixture.js';

describe('commander.strategy — validar() @regression', () => {
  it('TC-CMD-001: mazo válido de 100 cartas es aprobado', () => {
    const resultado = validar(COMMANDER_VALIDO);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('TC-CMD-002: mazo con 99 cartas es rechazado', () => {
    const resultado = validar(COMMANDER_99_CARTAS);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('exactamente 100 cartas'))).toBe(true);
  });

  it('TC-CMD-003: mazo con 101 cartas es rechazado', () => {
    const resultado = validar(COMMANDER_101_CARTAS);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('exactamente 100 cartas'))).toBe(true);
  });

  it('TC-CMD-004: mazo sin comandante es rechazado', () => {
    const resultado = validar(COMMANDER_SIN_COMANDANTE);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('exactamente 1 comandante'))).toBe(true);
  });

  it('TC-CMD-005: mazo con 2 comandantes es rechazado', () => {
    const resultado = validar(COMMANDER_DOS_COMANDANTES);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('exactamente 1 comandante'))).toBe(true);
  });

  it('TC-CMD-006: comandante que no es Legendary Creature es rechazado', () => {
    const resultado = validar(COMMANDER_NO_LEGENDARY_CREATURE);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('Legendary Creature'))).toBe(true);
  });

  it('TC-CMD-007: carta no básica duplicada es rechazada', () => {
    const resultado = validar(COMMANDER_CON_DUPLICADO);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('Sol Ring'))).toBe(true);
    expect(resultado.errores.some((e) => e.includes('1 copia'))).toBe(true);
  });

  it('TC-CMD-008: tierras básicas duplicadas son permitidas', () => {
    const resultado = validar(COMMANDER_TIERRAS_BASICAS_DUPLICADAS);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('TC-CMD-009: mazo vacío es rechazado con errores de total y comandante', () => {
    const resultado = validar(COMMANDER_VACIO);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('exactamente 100 cartas'))).toBe(true);
    expect(resultado.errores.some((e) => e.includes('exactamente 1 comandante'))).toBe(true);
  });

  it('TC-CMD-010: múltiples errores se reportan todos a la vez', () => {
    const resultado = validar(COMMANDER_MULTIPLES_ERRORES);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.length).toBeGreaterThanOrEqual(2);
    expect(resultado.errores.some((e) => e.includes('exactamente 100 cartas'))).toBe(true);
    expect(resultado.errores.some((e) => e.includes('exactamente 1 comandante'))).toBe(true);
  });
});
