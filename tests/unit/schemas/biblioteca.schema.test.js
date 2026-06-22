import { describe, it, expect } from 'vitest';
import { listarCartasSchema } from '../../../src/modules/biblioteca/biblioteca.schema.js';

describe('biblioteca schemas', () => {
  describe('listarCartasSchema', () => {
    it('TC-SCH-BIB-001: transforma string page a int, por defecto 1', () => {
      const result = listarCartasSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(1);
    });

    it('TC-SCH-BIB-002: transforma string limit a int, por defecto 50', () => {
      const result = listarCartasSchema.safeParse({});
      expect(result.data.limit).toBe(50);
    });

    it('TC-SCH-BIB-003: page como string numérica se parsea', () => {
      const result = listarCartasSchema.safeParse({ page: '3' });
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(3);
    });

    it('TC-SCH-BIB-004: rechaza limit mayor a 50', () => {
      expect(listarCartasSchema.safeParse({ limit: '51' }).success).toBe(false);
    });

    it('TC-SCH-BIB-005: incluir_tokens "true" se transforma a boolean true', () => {
      const result = listarCartasSchema.safeParse({ incluir_tokens: 'true' });
      expect(result.success).toBe(true);
      expect(result.data.incluir_tokens).toBe(true);
    });

    it('TC-SCH-BIB-006: incluir_arte omitido por defecto es false', () => {
      const result = listarCartasSchema.safeParse({});
      expect(result.data.incluir_arte).toBe(false);
    });

    it('TC-SCH-BIB-007: formato enum acepta formato válido', () => {
      const result = listarCartasSchema.safeParse({ formato: 'COMMANDER' });
      expect(result.success).toBe(true);
    });

    it('TC-SCH-BIB-008: formato enum rechaza formato inválido', () => {
      expect(listarCartasSchema.safeParse({ formato: 'VINTAGE' }).success).toBe(false);
    });
  });
});
