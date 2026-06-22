import { describe, it, expect } from 'vitest';
import { buscarQuerySchema, listarQuerySchema } from '../../../src/modules/cartas/cartas.schema.js';

describe('cartas schemas', () => {
  describe('buscarQuerySchema', () => {
    it('TC-SCH-CA-001: acepta q con al menos 1 carácter', () => {
      expect(buscarQuerySchema.safeParse({ q: 'sol' }).success).toBe(true);
    });

    it('TC-SCH-CA-002: rechaza q vacío', () => {
      expect(buscarQuerySchema.safeParse({ q: '' }).success).toBe(false);
    });
  });

  describe('listarQuerySchema', () => {
    it('TC-SCH-CA-003: coerce string page a número', () => {
      const result = listarQuerySchema.safeParse({ page: '3', limit: '10' });
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(3);
    });

    it('TC-SCH-CA-004: valores por defecto page=1 limit=20', () => {
      const result = listarQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    });

    it('TC-SCH-CA-005: rechaza limit mayor a 100', () => {
      expect(listarQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    });

    it('TC-SCH-CA-006: rechaza page negativo', () => {
      expect(listarQuerySchema.safeParse({ page: -1 }).success).toBe(false);
    });
  });
});
