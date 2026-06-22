import { describe, it, expect } from 'vitest';
import { registrarResultadoSchema, cambiarEstadoSchema } from '../../../src/modules/enfrentamientos/enfrentamientos.schema.js';

const UUID_1 = '550e8400-e29b-41d4-a716-446655440000';
const UUID_2 = '550e8400-e29b-41d4-a716-446655440001';

describe('enfrentamientos schemas', () => {
  describe('registrarResultadoSchema', () => {
    it('TC-SCH-EN-001: acepta 2 resultados válidos', () => {
      const data = {
        resultados: [
          { inscripcion_id: UUID_1, resultado: 'ganador' },
          { inscripcion_id: UUID_2, resultado: 'derrota' },
        ],
      };
      expect(registrarResultadoSchema.safeParse(data).success).toBe(true);
    });

    it('TC-SCH-EN-002: rechaza array con menos de 2 items', () => {
      const data = { resultados: [{ inscripcion_id: UUID_1, resultado: 'ganador' }] };
      expect(registrarResultadoSchema.safeParse(data).success).toBe(false);
    });

    it('TC-SCH-EN-003: rechaza inscripcion_id no UUID', () => {
      const data = {
        resultados: [
          { inscripcion_id: 'no-uuid', resultado: 'ganador' },
          { inscripcion_id: UUID_2, resultado: 'derrota' },
        ],
      };
      expect(registrarResultadoSchema.safeParse(data).success).toBe(false);
    });

    it('TC-SCH-EN-004: rechaza resultado inválido', () => {
      const data = {
        resultados: [
          { inscripcion_id: UUID_1, resultado: 'victoria' },
          { inscripcion_id: UUID_2, resultado: 'derrota' },
        ],
      };
      expect(registrarResultadoSchema.safeParse(data).success).toBe(false);
    });

    it('TC-SCH-EN-005: acepta empate como resultado', () => {
      const data = {
        resultados: [
          { inscripcion_id: UUID_1, resultado: 'empate' },
          { inscripcion_id: UUID_2, resultado: 'empate' },
        ],
      };
      expect(registrarResultadoSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('cambiarEstadoSchema', () => {
    it('TC-SCH-EN-006: acepta en_curso y finalizado', () => {
      expect(cambiarEstadoSchema.safeParse({ estado: 'en_curso' }).success).toBe(true);
      expect(cambiarEstadoSchema.safeParse({ estado: 'finalizado' }).success).toBe(true);
    });

    it('TC-SCH-EN-007: rechaza estado inválido', () => {
      expect(cambiarEstadoSchema.safeParse({ estado: 'pendiente' }).success).toBe(false);
    });
  });
});
