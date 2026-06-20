import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { ConnectionError } from 'sequelize';
import errorHandler from '../../../src/middleware/errorHandler.js';

function makeResMock() {
  const res = { statusCode: null, body: null };
  res.status = vi.fn((code) => { res.statusCode = code; return res; });
  res.json = vi.fn((data) => { res.body = data; return res; });
  return res;
}

describe('errorHandler middleware', () => {
  const req = {};
  const next = vi.fn();

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('TC-ERR-001: ZodError retorna 400 con detalles', () => {
    const result = z.object({ name: z.string() }).safeParse({ name: 123 });
    const err = result.error;
    const res = makeResMock();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    expect(res.body).toHaveProperty('detalles');
  });

  it('TC-ERR-002: ConnectionError retorna 503', () => {
    const err = new ConnectionError(new Error('connection refused'));
    const res = makeResMock();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.body.error).toContain('Servicio no disponible');
  });

  it('TC-ERR-003: error con .status usa ese código', () => {
    const err = Object.assign(new Error('No encontrado'), { status: 404 });
    const res = makeResMock();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.error).toBe('No encontrado');
  });

  it('TC-ERR-004: error con .statusCode usa ese código', () => {
    const err = Object.assign(new Error('Prohibido'), { statusCode: 403 });
    const res = makeResMock();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error).toBe('Prohibido');
  });

  it('TC-ERR-005: error genérico sin status retorna 500', () => {
    const err = new Error('algo falló');
    const res = makeResMock();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body.error).toBe('algo falló');
  });

  it('TC-ERR-006: error sin message usa mensaje por defecto', () => {
    const err = {};
    const res = makeResMock();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });

  it('TC-ERR-007: console.error se llama con el error', () => {
    const err = new Error('test');
    const res = makeResMock();

    errorHandler(err, req, res, next);

    expect(console.error).toHaveBeenCalledWith('[Error]', err);
  });
});
