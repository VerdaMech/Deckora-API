import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '../../../src/modules/auth/auth.schema.js';

describe('auth schemas', () => {
  describe('signupSchema', () => {
    const valid = { nombre_usuario: 'user1', correo: 'a@b.com', password: '12345678', rol: 'jugador' };

    it('TC-SCH-AUTH-001: acepta datos válidos', () => {
      expect(signupSchema.safeParse(valid).success).toBe(true);
    });

    it('TC-SCH-AUTH-002: rechaza nombre_usuario menor a 3 caracteres', () => {
      expect(signupSchema.safeParse({ ...valid, nombre_usuario: 'ab' }).success).toBe(false);
    });

    it('TC-SCH-AUTH-003: rechaza correo inválido', () => {
      expect(signupSchema.safeParse({ ...valid, correo: 'no-email' }).success).toBe(false);
    });

    it('TC-SCH-AUTH-004: rechaza password menor a 8 caracteres', () => {
      expect(signupSchema.safeParse({ ...valid, password: '1234567' }).success).toBe(false);
    });

    it('TC-SCH-AUTH-005: rechaza rol inválido', () => {
      expect(signupSchema.safeParse({ ...valid, rol: 'admin' }).success).toBe(false);
    });

    it('TC-SCH-AUTH-006: acepta los tres roles válidos', () => {
      for (const rol of ['jugador', 'organizador', 'tienda']) {
        expect(signupSchema.safeParse({ ...valid, rol }).success).toBe(true);
      }
    });
  });

  describe('loginSchema', () => {
    const valid = { correo: 'a@b.com', password: '12345678' };

    it('TC-SCH-AUTH-007: acepta datos válidos', () => {
      expect(loginSchema.safeParse(valid).success).toBe(true);
    });

    it('TC-SCH-AUTH-008: rechaza correo faltante', () => {
      expect(loginSchema.safeParse({ password: '12345678' }).success).toBe(false);
    });

    it('TC-SCH-AUTH-009: rechaza password corto', () => {
      expect(loginSchema.safeParse({ ...valid, password: '1234' }).success).toBe(false);
    });
  });
});
