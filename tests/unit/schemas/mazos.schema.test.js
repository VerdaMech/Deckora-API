import { describe, it, expect } from 'vitest';
import {
  crearMazoSchema,
  agregarCartaMazoSchema,
  actualizarCartaMazoSchema,
  importarMazoSchema,
  actualizarMazoSchema,
} from '../../../src/modules/mazos/mazos.schema.js';

describe('mazos schemas', () => {
  describe('crearMazoSchema', () => {
    it('TC-SCH-MZ-001: acepta datos válidos', () => {
      expect(crearMazoSchema.safeParse({ nombre: 'Mi Mazo', formato: 'COMMANDER' }).success).toBe(true);
    });

    it('TC-SCH-MZ-002: rechaza nombre vacío', () => {
      expect(crearMazoSchema.safeParse({ nombre: '', formato: 'STANDARD' }).success).toBe(false);
    });

    it('TC-SCH-MZ-003: rechaza formato inválido', () => {
      expect(crearMazoSchema.safeParse({ nombre: 'Test', formato: 'VINTAGE' }).success).toBe(false);
    });

    it('TC-SCH-MZ-004: publico por defecto es false', () => {
      const result = crearMazoSchema.safeParse({ nombre: 'Test', formato: 'STANDARD' });
      expect(result.data.publico).toBe(false);
    });

    it('TC-SCH-MZ-005: acepta todos los formatos válidos', () => {
      for (const formato of ['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY']) {
        expect(crearMazoSchema.safeParse({ nombre: 'T', formato }).success).toBe(true);
      }
    });
  });

  describe('agregarCartaMazoSchema', () => {
    it('TC-SCH-MZ-006: acepta datos válidos', () => {
      expect(agregarCartaMazoSchema.safeParse({ scryfall_id: 'abc', cantidad: 1 }).success).toBe(true);
    });

    it('TC-SCH-MZ-007: rechaza cantidad no positiva', () => {
      expect(agregarCartaMazoSchema.safeParse({ scryfall_id: 'abc', cantidad: 0 }).success).toBe(false);
      expect(agregarCartaMazoSchema.safeParse({ scryfall_id: 'abc', cantidad: -1 }).success).toBe(false);
    });

    it('TC-SCH-MZ-008: es_comandante por defecto es false', () => {
      const result = agregarCartaMazoSchema.safeParse({ scryfall_id: 'abc', cantidad: 1 });
      expect(result.data.es_comandante).toBe(false);
    });
  });

  describe('actualizarCartaMazoSchema', () => {
    it('TC-SCH-MZ-009: todos los campos son opcionales', () => {
      expect(actualizarCartaMazoSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('importarMazoSchema', () => {
    it('TC-SCH-MZ-010: acepta lista con contenido', () => {
      expect(importarMazoSchema.safeParse({ lista: '4 Lightning Bolt' }).success).toBe(true);
    });

    it('TC-SCH-MZ-011: rechaza lista vacía', () => {
      expect(importarMazoSchema.safeParse({ lista: '' }).success).toBe(false);
    });
  });

  describe('actualizarMazoSchema', () => {
    it('TC-SCH-MZ-012: acepta actualización parcial', () => {
      expect(actualizarMazoSchema.safeParse({ nombre: 'Nuevo' }).success).toBe(true);
    });

    it('TC-SCH-MZ-013: rechaza objeto vacío (refine)', () => {
      expect(actualizarMazoSchema.safeParse({}).success).toBe(false);
    });

    it('TC-SCH-MZ-014: rechaza nombre mayor a 80 caracteres', () => {
      expect(actualizarMazoSchema.safeParse({ nombre: 'a'.repeat(81) }).success).toBe(false);
    });
  });
});
