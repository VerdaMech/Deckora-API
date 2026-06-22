import { describe, it, expect } from 'vitest';
import { validar } from '../../../src/modules/mazos/estrategias/modern.strategy.js';
import {
  FORMATO_60_VALIDO,
  FORMATO_59_INVALIDO,
  FORMATO_CARTA_5_COPIAS,
  FORMATO_TIERRA_BASICA_MUCHAS,
  FORMATO_EXACTAMENTE_4_COPIAS,
  FORMATO_SIN_LIMITE_SUPERIOR,
  FORMATO_VACIO,
} from '../../fixtures/mazos.fixture.js';

describe('modern.strategy — validar()', () => {
  it('TC-MOD-001: mazo de 60 cartas con máximo 4 copias es válido', () => {
    const resultado = validar(FORMATO_60_VALIDO);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('TC-MOD-002: mazo de 59 cartas es rechazado', () => {
    const resultado = validar(FORMATO_59_INVALIDO);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('Modern') && e.includes('mínimo 60'))).toBe(true);
  });

  it('TC-MOD-003: carta con 5 copias es rechazada', () => {
    const resultado = validar(FORMATO_CARTA_5_COPIAS);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('Modern') && e.includes('máximo'))).toBe(true);
  });

  it('TC-MOD-004: tierra básica con 20 copias es válida', () => {
    const resultado = validar(FORMATO_TIERRA_BASICA_MUCHAS);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('TC-MOD-005: carta con exactamente 4 copias está en el límite permitido', () => {
    const resultado = validar(FORMATO_EXACTAMENTE_4_COPIAS);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('TC-MOD-006: Modern no tiene límite superior de cartas (500 cartas válido)', () => {
    const resultado = validar(FORMATO_SIN_LIMITE_SUPERIOR);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('TC-MOD-007: mazo vacío es rechazado por no llegar al mínimo de 60', () => {
    const resultado = validar(FORMATO_VACIO);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('mínimo 60'))).toBe(true);
  });
});
