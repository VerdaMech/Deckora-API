import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { JUGADOR_TEST } from '../fixtures/usuarios.fixture.js';
import { TOKEN_JUGADOR, configurarAuthMock } from '../helpers/api.helper.js';

// ─── Mocks de módulos ─────────────────────────────────────────────────────────

vi.mock('../../src/config/supabase.js', () => ({
  default: { auth: { getUser: vi.fn() } },
}));

vi.mock('../../src/config/db.js', () => ({
  default: { transaction: vi.fn(), query: vi.fn() },
}));

vi.mock('../../src/modules/notificaciones/email.service.js', () => ({
  notificarSolicitudInscripcion: vi.fn(),
  notificarInscripcionAceptada: vi.fn(),
  notificarInscripcionRechazada: vi.fn(),
}));

vi.mock('../../src/models/index.js', () => ({
  default: {},
  Usuario: { findByPk: vi.fn() },
  Jugador: {},
  Organizador: {},
  Tienda: {},
  Mazo: {},
  MazoCarta: {},
  Carta: {},
  Torneo: {},
  Ronda: {},
  Enfrentamiento: {},
  EnfrentamientoParticipante: {},
  Inscripcion: {},
  Estadistica: {},
  SnapshotMazoInscripcion: {},
  sequelize: { transaction: vi.fn(), query: vi.fn() },
}));

vi.mock('../../src/modules/auth/auth.service.js', () => ({
  signup: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  eliminarCuenta: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const authService = await import('../../src/modules/auth/auth.service.js');
const { default: app } = await import('../../src/app.js');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// Endpoints públicos
// ═══════════════════════════════════════════════════════════════════════════

describe('API — GET /health', () => {
  it('TC-API-001: devuelve 200 con ok:true y timestamp', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('API — ruta inexistente', () => {
  it('TC-API-010: GET /api/no-existe devuelve 404', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/signup
// ═══════════════════════════════════════════════════════════════════════════

describe('auth API — POST /api/auth/signup', () => {
  const bodyValido = {
    nombre_usuario: 'jugador_test',
    correo: 'jugador@test.local',
    password: 'password123',
    rol: 'jugador',
  };

  it('TC-API-004: body válido devuelve 201 con access_token', async () => {
    authService.signup.mockResolvedValue({
      access_token: 'tok-1',
      usuario: { id: 'uid-1', rol: 'jugador' },
    });

    const res = await request(app)
      .post('/api/auth/signup')
      .send(bodyValido);

    expect(res.status).toBe(201);
    expect(res.body.access_token).toBe('tok-1');
    expect(authService.signup).toHaveBeenCalledOnce();
  });

  it('TC-API-005: email inválido devuelve 400 con mensaje de validación', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...bodyValido, correo: 'no-es-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    expect(authService.signup).not.toHaveBeenCalled();
  });

  it('TC-API-011: sin campo rol devuelve 400 Zod', async () => {
    const { rol: _rol, ...sinRol } = bodyValido;

    const res = await request(app)
      .post('/api/auth/signup')
      .send(sinRol);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    expect(authService.signup).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════════════════════

describe('auth API — POST /api/auth/login', () => {
  it('TC-API-012: credenciales válidas devuelven 200 con access_token', async () => {
    authService.login.mockResolvedValue({
      access_token: 'tok-2',
      usuario: { id: JUGADOR_TEST.id, rol: 'jugador' },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'jugador@test.local', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('tok-2');
  });

  it('TC-API-013: password vacío devuelve 400 Zod', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'jugador@test.local', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    expect(authService.login).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/auth/me — protegido
// ═══════════════════════════════════════════════════════════════════════════

describe('auth API — GET /api/auth/me', () => {
  it('TC-API-AUTH-001: sin token devuelve 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Token no provisto/);
  });

  it('TC-API-AUTH-002: token válido devuelve 200 con perfil', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    Usuario.findByPk
      .mockResolvedValueOnce(JUGADOR_TEST)
      .mockResolvedValueOnce({ ...JUGADOR_TEST, toJSON: () => ({ ...JUGADOR_TEST }) });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(200);
  });

  it('TC-API-AUTH-003: jugador autenticado recibe datos con perfil de jugador', async () => {
    const jugadorConPerfil = {
      ...JUGADOR_TEST,
      Jugador: { id: 'jug-profile-1', nivel: 5 },
      toJSON() {
        return { ...JUGADOR_TEST, Jugador: this.Jugador };
      },
    };

    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    // Segunda findByPk: el controller hace Usuario.findByPk(id, { include })
    Usuario.findByPk
      .mockResolvedValueOnce(JUGADOR_TEST)          // middleware auth
      .mockResolvedValueOnce(jugadorConPerfil);      // controller me()

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(200);
    expect(res.body.perfil).toEqual({ id: 'jug-profile-1', nivel: 5 });
    expect(res.body.Jugador).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/auth/logout
// ═══════════════════════════════════════════════════════════════════════════

describe('auth API — POST /api/auth/logout', () => {
  it('TC-API-AUTH-004: sin token devuelve 401', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Token no provisto/);
  });

  it('TC-API-AUTH-005: usuario autenticado recibe 204 al cerrar sesion', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    authService.logout.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(204);
    expect(authService.logout).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Error paths — cubrir catch(next) de cada controller
// ═══════════════════════════════════════════════════════════════════════════

describe('auth API — error paths de controllers', () => {
  it('TC-API-AUTH-006: signup error del service propaga al errorHandler', async () => {
    authService.signup.mockRejectedValue(Object.assign(new Error('Email duplicado'), { status: 409 }));
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ nombre_usuario: 'test', correo: 'a@b.com', password: '12345678', rol: 'jugador' });
    expect(res.status).toBe(409);
  });

  it('TC-API-AUTH-007: login error del service propaga al errorHandler', async () => {
    authService.login.mockRejectedValue(Object.assign(new Error('Credenciales inválidas'), { status: 401 }));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'a@b.com', password: '12345678' });
    expect(res.status).toBe(401);
  });

  it('TC-API-AUTH-008: me con usuario no encontrado devuelve 404', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    Usuario.findByPk
      .mockResolvedValueOnce(JUGADOR_TEST)
      .mockResolvedValueOnce(null);
    const res = await request(app).get('/api/auth/me').set('Authorization', TOKEN_JUGADOR);
    expect(res.status).toBe(404);
  });

  it('TC-API-AUTH-009: me error interno propaga 500', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    Usuario.findByPk
      .mockResolvedValueOnce(JUGADOR_TEST)
      .mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/auth/me').set('Authorization', TOKEN_JUGADOR);
    expect(res.status).toBe(500);
  });

  it('TC-API-AUTH-010: logout error propaga al errorHandler', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    authService.logout.mockRejectedValue(new Error('Supabase error'));
    const res = await request(app).post('/api/auth/logout').set('Authorization', TOKEN_JUGADOR);
    expect(res.status).toBe(500);
  });
});
