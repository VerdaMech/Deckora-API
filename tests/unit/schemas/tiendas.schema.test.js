import { describe, it, expect } from 'vitest';
import { actualizarTiendaSchema, cercanaQuerySchema } from '../../../src/modules/tiendas/tiendas.schema.js';

describe('tiendas schemas', () => {
  describe('actualizarTiendaSchema', () => {
    it('TC-SCH-TI-001: acepta datos parciales válidos', () => {
      expect(actualizarTiendaSchema.safeParse({ nombre_tienda: 'Mi Tienda' }).success).toBe(true);
    });

    it('TC-SCH-TI-002: rechaza latitud fuera de rango -90..90', () => {
      expect(actualizarTiendaSchema.safeParse({ latitud: 91 }).success).toBe(false);
      expect(actualizarTiendaSchema.safeParse({ latitud: -91 }).success).toBe(false);
    });

    it('TC-SCH-TI-003: rechaza longitud fuera de rango -180..180', () => {
      expect(actualizarTiendaSchema.safeParse({ longitud: 181 }).success).toBe(false);
      expect(actualizarTiendaSchema.safeParse({ longitud: -181 }).success).toBe(false);
    });

    it('TC-SCH-TI-004: acepta latitud y longitud null', () => {
      expect(actualizarTiendaSchema.safeParse({ latitud: null, longitud: null }).success).toBe(true);
    });
  });

  describe('cercanaQuerySchema', () => {
    it('TC-SCH-TI-005: coerce string lat/lng a números', () => {
      const result = cercanaQuerySchema.safeParse({ lat: '-33.45', lng: '-70.66' });
      expect(result.success).toBe(true);
      expect(result.data.lat).toBe(-33.45);
    });

    it('TC-SCH-TI-006: radio por defecto es 10', () => {
      const result = cercanaQuerySchema.safeParse({ lat: '0', lng: '0' });
      expect(result.data.radio).toBe(10);
    });

    it('TC-SCH-TI-007: rechaza radio no positivo', () => {
      expect(cercanaQuerySchema.safeParse({ lat: '0', lng: '0', radio: '0' }).success).toBe(false);
      expect(cercanaQuerySchema.safeParse({ lat: '0', lng: '0', radio: '-5' }).success).toBe(false);
    });
  });
});
