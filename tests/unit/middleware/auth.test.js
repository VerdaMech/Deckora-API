import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReqResMock, mockSupabaseAuthOk, mockSupabaseAuthFail } from '../../helpers/auth.helper.js';
import { JUGADOR_TEST, USUARIO_INACTIVO_TEST } from '../../fixtures/usuarios.fixture.js';

vi.mock('../../../src/config/supabase.js', () => ({
  default: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock('../../../src/models/index.js', () => ({
  Usuario: {
    findByPk: vi.fn(),
  },
}));

const { default: auth } = await import('../../../src/middleware/auth.js');
const { default: supabase } = await import('../../../src/config/supabase.js');
const { Usuario } = await import('../../../src/models/index.js');

describe('auth middleware @regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TC-AUTH-001: token válido autentica y llama a next()', async () => {
    supabase.auth.getUser.mockResolvedValue(mockSupabaseAuthOk(JUGADOR_TEST.id));
    Usuario.findByPk.mockResolvedValue(JUGADOR_TEST);

    const { req, res, next } = makeReqResMock({ authorization: 'Bearer token_valido' });
    await auth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.usuario).toBe(JUGADOR_TEST);
    expect(req.usuarioAuth).toBeDefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('TC-AUTH-002: sin header Authorization devuelve 401 con "Token no provisto"', async () => {
    const { req, res, next } = makeReqResMock({});
    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no provisto' });
    expect(next).not.toHaveBeenCalled();
  });

  it('TC-AUTH-003: header Authorization sin prefijo Bearer devuelve 401', async () => {
    const { req, res, next } = makeReqResMock({ authorization: 'Basic abc123' });
    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no provisto' });
    expect(next).not.toHaveBeenCalled();
  });

  it('TC-AUTH-004: token rechazado por Supabase devuelve 401 con "Token inválido"', async () => {
    supabase.auth.getUser.mockResolvedValue(mockSupabaseAuthFail());

    const { req, res, next } = makeReqResMock({ authorization: 'Bearer token_invalido' });
    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('TC-AUTH-005: usuario no registrado en BD local devuelve 401', async () => {
    supabase.auth.getUser.mockResolvedValue(mockSupabaseAuthOk('uid-no-registrado'));
    Usuario.findByPk.mockResolvedValue(null);

    const { req, res, next } = makeReqResMock({ authorization: 'Bearer token_valido' });
    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Usuario autenticado pero no registrado en el sistema',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('TC-AUTH-006: usuario con cuenta desactivada devuelve 401 con "Cuenta desactivada"', async () => {
    supabase.auth.getUser.mockResolvedValue(mockSupabaseAuthOk(USUARIO_INACTIVO_TEST.id));
    Usuario.findByPk.mockResolvedValue(USUARIO_INACTIVO_TEST);

    const { req, res, next } = makeReqResMock({ authorization: 'Bearer token_valido' });
    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cuenta desactivada' });
    expect(next).not.toHaveBeenCalled();
  });

  it('TC-AUTH-007: token expirado (Supabase rechaza) devuelve 401', async () => {
    supabase.auth.getUser.mockResolvedValue(mockSupabaseAuthFail('JWT expired'));

    const { req, res, next } = makeReqResMock({ authorization: 'Bearer token_expirado' });
    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido' });
    expect(next).not.toHaveBeenCalled();
  });
});
