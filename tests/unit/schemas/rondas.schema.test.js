import { describe, it, expect } from 'vitest';
import { crearRondaSchema } from '../../../src/modules/rondas/rondas.schema.js';

const UUID_1 = '550e8400-e29b-41d4-a716-446655440000';
const UUID_2 = '550e8400-e29b-41d4-a716-446655440001';
const UUID_3 = '550e8400-e29b-41d4-a716-446655440002';

describe('rondas schemas', () => {
  describe('crearRondaSchema', () => {
    it('TC-SCH-RO-001: acepta tipo_ronda swiss', () => {
      expect(crearRondaSchema.safeParse({ tipo_ronda: 'swiss' }).success).toBe(true);
    });

    it('TC-SCH-RO-002: acepta todos los tipos válidos', () => {
      for (const tipo of ['swiss', 'eliminacion_directa', 'final']) {
        expect(crearRondaSchema.safeParse({ tipo_ronda: tipo }).success).toBe(true);
      }
    });

    it('TC-SCH-RO-003: rechaza tipo_ronda inválido', () => {
      expect(crearRondaSchema.safeParse({ tipo_ronda: 'round_robin' }).success).toBe(false);
    });

    it('TC-SCH-RO-004: asignaciones son opcionales', () => {
      expect(crearRondaSchema.safeParse({ tipo_ronda: 'swiss' }).success).toBe(true);
    });

    it('TC-SCH-RO-005: asignaciones con 2 UUIDs válidas', () => {
      const data = {
        tipo_ronda: 'swiss',
        asignaciones: [{ inscripcion_ids: [UUID_1, UUID_2] }],
      };
      expect(crearRondaSchema.safeParse(data).success).toBe(true);
    });

    it('TC-SCH-RO-006: rechaza asignaciones con menos de 2 UUIDs', () => {
      const data = {
        tipo_ronda: 'swiss',
        asignaciones: [{ inscripcion_ids: [UUID_1] }],
      };
      expect(crearRondaSchema.safeParse(data).success).toBe(false);
    });

    it('TC-SCH-RO-007: rechaza asignaciones con más de 4 UUIDs', () => {
      const data = {
        tipo_ronda: 'swiss',
        asignaciones: [{ inscripcion_ids: [UUID_1, UUID_2, UUID_3, UUID_1, UUID_2] }],
      };
      expect(crearRondaSchema.safeParse(data).success).toBe(false);
    });

    it('TC-SCH-RO-008: rechaza UUIDs inválidos en asignaciones', () => {
      const data = {
        tipo_ronda: 'swiss',
        asignaciones: [{ inscripcion_ids: ['no-uuid', UUID_2] }],
      };
      expect(crearRondaSchema.safeParse(data).success).toBe(false);
    });
  });
});
