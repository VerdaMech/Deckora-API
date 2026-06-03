import { describe, it, expect } from 'vitest';
import { validar } from '../../../src/modules/mazos/estrategias/standard.strategy.js';
import {
  STANDARD_60_VALIDO,
  STANDARD_59_CARTAS,
  STANDARD_250_VALIDO,
  STANDARD_251_CARTAS,
  STANDARD_CARTA_5_COPIAS,
  STANDARD_TIERRA_BASICA_MUCHAS,
  STANDARD_EXACTAMENTE_4_COPIAS,
} from '../../fixtures/mazos.fixture.js';

describe('standard.strategy — validar()', () => {
  it('TC-STD-001: mazo de 60 cartas con máximo 4 copias es válido', () => {
    const resultado = validar(STANDARD_60_VALIDO);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('TC-STD-002: mazo de 59 cartas es rechazado', () => {
    const resultado = validar(STANDARD_59_CARTAS);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('entre 60 y 250'))).toBe(true);
  });

  it('TC-STD-003: mazo de exactamente 250 cartas es válido', () => {
    const resultado = validar(STANDARD_250_VALIDO);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('TC-STD-004: mazo de 251 cartas es rechazado', () => {
    const resultado = validar(STANDARD_251_CARTAS);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('entre 60 y 250'))).toBe(true);
  });

  it('TC-STD-005: carta con 5 copias es rechazada', () => {
    const resultado = validar(STANDARD_CARTA_5_COPIAS);
    expect(resultado.valido).toBe(false);
    expect(resultado.errores.some((e) => e.includes('Lightning Bolt'))).toBe(true);
    expect(resultado.errores.some((e) => e.includes('máximo en Standard es 4'))).toBe(true);
  });

  it('TC-STD-006: tierra básica con 20 copias es válida', () => {
    const resultado = validar(STANDARD_TIERRA_BASICA_MUCHAS);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('TC-STD-007: carta con exactamente 4 copias está en el límite permitido', () => {
    const resultado = validar(STANDARD_EXACTAMENTE_4_COPIAS);
    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });
});
