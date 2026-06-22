import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import validate from '../../../src/middleware/validate.js';

const schema = z.object({
  nombre: z.string().min(1),
  cantidad: z.number().int().positive(),
});

function makeResMock() {
  const res = { statusCode: null, body: null };
  res.status = vi.fn((code) => { res.statusCode = code; return res; });
  res.json = vi.fn((data) => { res.body = data; return res; });
  return res;
}

describe('validate middleware', () => {
  const middleware = validate(schema);

  it('TC-VAL-001: body válido llama a next() sin argumentos', () => {
    const req = { body: { nombre: 'Test', cantidad: 5 } };
    const res = makeResMock();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('TC-VAL-002: body válido transforma req.body con datos parseados', () => {
    const req = { body: { nombre: 'Test', cantidad: 5, extra: 'ignorado' } };
    const res = makeResMock();
    const next = vi.fn();

    middleware(req, res, next);

    expect(req.body).toEqual({ nombre: 'Test', cantidad: 5 });
    expect(req.body).not.toHaveProperty('extra');
  });

  it('TC-VAL-003: body inválido retorna 400 con error y detalles', () => {
    const req = { body: { nombre: '', cantidad: -1 } };
    const res = makeResMock();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    expect(res.body).toHaveProperty('detalles');
  });

  it('TC-VAL-004: body inválido no llama a next()', () => {
    const req = { body: {} };
    const res = makeResMock();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  it('TC-VAL-005: schema con coercion transforma datos correctamente', () => {
    const coerceSchema = z.object({ activo: z.coerce.boolean().default(false) });
    const mw = validate(coerceSchema);
    const req = { body: { activo: 'true' } };
    const res = makeResMock();
    const next = vi.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.activo).toBe(true);
  });
});
