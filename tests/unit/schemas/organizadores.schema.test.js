import { describe, it, expect } from 'vitest';
import { actualizarOrganizadorSchema } from '../../../src/modules/organizadores/organizadores.schema.js';

describe('organizadores schemas', () => {
  describe('actualizarOrganizadorSchema', () => {
    it('TC-SCH-OR-001: acepta descripcion válida', () => {
      expect(actualizarOrganizadorSchema.safeParse({ descripcion: 'Org de torneos' }).success).toBe(true);
    });

    it('TC-SCH-OR-002: rechaza descripcion mayor a 1000 caracteres', () => {
      expect(actualizarOrganizadorSchema.safeParse({ descripcion: 'a'.repeat(1001) }).success).toBe(false);
    });

    it('TC-SCH-OR-003: acepta URL válida para sitio_web', () => {
      expect(actualizarOrganizadorSchema.safeParse({ sitio_web: 'https://example.com' }).success).toBe(true);
    });

    it('TC-SCH-OR-004: acepta string vacío para sitio_web', () => {
      expect(actualizarOrganizadorSchema.safeParse({ sitio_web: '' }).success).toBe(true);
    });

    it('TC-SCH-OR-005: rechaza objeto vacío (refine)', () => {
      expect(actualizarOrganizadorSchema.safeParse({}).success).toBe(false);
    });
  });
});
