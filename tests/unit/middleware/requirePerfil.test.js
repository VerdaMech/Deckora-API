import { describe, it, expect, vi } from 'vitest';
import requirePerfil from '../../../src/middleware/requirePerfil.js';

function makeResMock() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

describe('requirePerfil middleware @regression', () => {
  it('TC-ROL-001: rol correcto llama a next()', () => {
    const req = { usuario: { rol: 'organizador' } };
    const res = makeResMock();
    const next = vi.fn();

    requirePerfil('organizador')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('TC-ROL-002: rol incorrecto devuelve 403', () => {
    const req = { usuario: { rol: 'jugador' } };
    const res = makeResMock();
    const next = vi.fn();

    requirePerfil('organizador')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso denegado: rol insuficiente' });
    expect(next).not.toHaveBeenCalled();
  });

  it('TC-ROL-003: sin req.usuario devuelve 401', () => {
    const req = {};
    const res = makeResMock();
    const next = vi.fn();

    requirePerfil('organizador')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('TC-ROL-004: múltiples roles — rol válido en la lista llama a next()', () => {
    const req = { usuario: { rol: 'tienda' } };
    const res = makeResMock();
    const next = vi.fn();

    requirePerfil('organizador', 'tienda')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('TC-ROL-005: múltiples roles — rol fuera de la lista devuelve 403', () => {
    const req = { usuario: { rol: 'jugador' } };
    const res = makeResMock();
    const next = vi.fn();

    requirePerfil('organizador', 'tienda')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso denegado: rol insuficiente' });
    expect(next).not.toHaveBeenCalled();
  });
});
