import { describe, it, expect } from 'vitest';
import {
  crearTorneoSchema,
  actualizarTorneoSchema,
  inscribirSchema,
  cambiarEstadoSchema,
} from '../../../src/modules/torneos/torneos.schema.js';

const FECHA_FUTURA = '2099-12-31T00:00:00+00:00';
const FECHA_PASADA = '2020-01-01T00:00:00+00:00';

describe('torneos schemas', () => {
  describe('crearTorneoSchema', () => {
    const valid = { nombre: 'Torneo Alpha', fecha: FECHA_FUTURA, formato: 'COMMANDER' };

    it('TC-SCH-TO-001: acepta torneo válido con fecha futura', () => {
      expect(crearTorneoSchema.safeParse(valid).success).toBe(true);
    });

    it('TC-SCH-TO-002: rechaza fecha pasada', () => {
      expect(crearTorneoSchema.safeParse({ ...valid, fecha: FECHA_PASADA }).success).toBe(false);
    });

    it('TC-SCH-TO-003: rechaza formato inválido', () => {
      expect(crearTorneoSchema.safeParse({ ...valid, formato: 'VINTAGE' }).success).toBe(false);
    });

    it('TC-SCH-TO-004: acepta ISO datetime con offset', () => {
      expect(crearTorneoSchema.safeParse({ ...valid, fecha: '2099-07-15T10:00:00-03:00' }).success).toBe(true);
    });

    it('TC-SCH-TO-005: acepta fecha solo YYYY-MM-DD', () => {
      expect(crearTorneoSchema.safeParse({ ...valid, fecha: '2099-07-15' }).success).toBe(true);
    });

    it('TC-SCH-TO-006: nombre mínimo 3 caracteres', () => {
      expect(crearTorneoSchema.safeParse({ ...valid, nombre: 'ab' }).success).toBe(false);
    });
  });

  describe('actualizarTorneoSchema', () => {
    it('TC-SCH-TO-007: rechaza objeto vacío', () => {
      expect(actualizarTorneoSchema.safeParse({}).success).toBe(false);
    });

    it('TC-SCH-TO-008: rechaza fecha pasada si se envía', () => {
      expect(actualizarTorneoSchema.safeParse({ fecha: FECHA_PASADA }).success).toBe(false);
    });

    it('TC-SCH-TO-009: acepta actualización sin fecha', () => {
      expect(actualizarTorneoSchema.safeParse({ nombre: 'Nuevo Nombre' }).success).toBe(true);
    });
  });

  describe('inscribirSchema', () => {
    it('TC-SCH-TO-010: acepta UUID válido', () => {
      expect(inscribirSchema.safeParse({ mazo_id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true);
    });

    it('TC-SCH-TO-011: rechaza string no UUID', () => {
      expect(inscribirSchema.safeParse({ mazo_id: 'no-uuid' }).success).toBe(false);
    });
  });

  describe('cambiarEstadoSchema', () => {
    it('TC-SCH-TO-012: acepta estados válidos', () => {
      for (const estado of ['pendiente', 'en_curso', 'finalizado', 'cancelado']) {
        expect(cambiarEstadoSchema.safeParse({ estado }).success).toBe(true);
      }
    });

    it('TC-SCH-TO-013: rechaza estado inválido', () => {
      expect(cambiarEstadoSchema.safeParse({ estado: 'borrado' }).success).toBe(false);
    });
  });
});
