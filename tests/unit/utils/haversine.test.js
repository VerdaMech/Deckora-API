import { describe, it, expect } from 'vitest';
import { calcularDistancia } from '../../../src/utils/haversine.js';

describe('haversine — calcularDistancia()', () => {
  it('TC-HAV-001: mismo punto retorna 0', () => {
    expect(calcularDistancia(-33.45, -70.66, -33.45, -70.66)).toBe(0);
  });

  it('TC-HAV-002: Santiago a Buenos Aires (~1130 km)', () => {
    const d = calcularDistancia(-33.45, -70.66, -34.6, -58.38);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1200);
  });

  it('TC-HAV-003: ecuador completo (0,0 a 0,180 ≈ 20015 km)', () => {
    const d = calcularDistancia(0, 0, 0, 180);
    expect(d).toBeGreaterThan(20000);
    expect(d).toBeLessThan(20100);
  });

  it('TC-HAV-004: polo norte a polo sur (~20015 km)', () => {
    const d = calcularDistancia(90, 0, -90, 0);
    expect(d).toBeGreaterThan(20000);
    expect(d).toBeLessThan(20100);
  });

  it('TC-HAV-005: distancia corta entre puntos cercanos', () => {
    const d = calcularDistancia(-33.45, -70.66, -33.451, -70.661);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(1);
  });

  it('TC-HAV-006: coordenadas negativas funcionan correctamente', () => {
    const d = calcularDistancia(-33.45, -70.66, -34.6, -58.38);
    expect(d).toBeGreaterThan(0);
  });
});
