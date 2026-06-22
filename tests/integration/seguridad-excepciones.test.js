import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ConnectionError } from 'sequelize';
import { JUGADOR_TEST } from '../fixtures/usuarios.fixture.js';
import { configurarAuthMock } from '../helpers/api.helper.js';

// ═══════════════════════════════════════════════════════════════════════════
// OWASP A10:2025 — Condiciones excepcionales / fallas de servicios externos
//
// Verifica que ante caídas de Supabase, rate limit, base de datos no disponible
// o degradación de un servicio externo, la API responde con errores CONTROLADOS
// (401 / 429 / 503) y JSON limpio, sin filtrar stack traces ni detalles internos.
//
// Nota: estos tests motivaron dos correcciones de producción —
//   • auth.service.signup(): rate limit → 429 y caída del proveedor → 503.
//   • errorHandler: ConnectionError de Sequelize → 503.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Mocks de módulos ─────────────────────────────────────────────────────────

vi.mock('../../src/config/supabase.js', () => ({
  default: {
    auth: {
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      admin: { deleteUser: vi.fn() },
    },
  },
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
  Usuario: { findByPk: vi.fn(), create: vi.fn(), update: vi.fn() },
  Jugador: { create: vi.fn() },
  Organizador: { create: vi.fn() },
  Tienda: { create: vi.fn() },
  Mazo: {},
  MazoCarta: {},
  Carta: {},
  Torneo: {},
  Ronda: {},
  Enfrentamiento: {},
  EnfrentamientoParticipante: {},
  Inscripcion: {},
  Estadistica: { create: vi.fn() },
  SnapshotMazoInscripcion: {},
  sequelize: { transaction: vi.fn(), query: vi.fn() },
}));

vi.mock('../../src/modules/mazos/mazos.repository.js', () => ({
  listarPorJugador: vi.fn(),
  crear: vi.fn(),
  buscarPorId: vi.fn(),
  agregarCarta: vi.fn(),
  actualizarCarta: vi.fn(),
  eliminarCarta: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  buscarRecomendaciones: vi.fn(),
}));

vi.mock('../../src/modules/cartas/cartas.repository.js', () => ({
  buscarPorScryfallId: vi.fn(),
  buscarPorId: vi.fn(),
  buscarPorNombre: vi.fn(),
  buscarPorNombreExacto: vi.fn(),
  buscarPorSetYNumero: vi.fn(),
}));

vi.mock('../../src/utils/openrouter.js', () => ({
  generateExplanation: vi.fn(),
  generarListaMazo: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const mazosRepo = await import('../../src/modules/mazos/mazos.repository.js');
const openrouter = await import('../../src/utils/openrouter.js');
const authService = await import('../../src/modules/auth/auth.service.js');
const mazosService = await import('../../src/modules/mazos/mazos.service.js');
const errorHandler = (await import('../../src/middleware/errorHandler.js')).default;
const { default: app } = await import('../../src/app.js');

const DATOS_SIGNUP = {
  nombre_usuario: 'jugador_test',
  correo: 'jugador@test.local',
  password: 'Secreta123',
  rol: 'jugador',
};

beforeEach(() => {
  vi.clearAllMocks();
  // El errorHandler registra con console.error; se silencia para no ensuciar el output.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ═══════════════════════════════════════════════════════════════════════════
// Supabase Auth caído
// ═══════════════════════════════════════════════════════════════════════════

describe('A10 — Supabase Auth caído', () => {
  it('TC-SEC-A10-001: si supabase.auth.getUser lanza, el middleware responde 401 sin stack trace', async () => {
    supabase.auth.getUser.mockRejectedValue(new Error('network error: ECONNRESET supabase.co'));

    const res = await request(app)
      .get('/api/mazos')
      .set('Authorization', 'Bearer token-cualquiera');

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('stack');
    // El detalle interno del error no se filtra al cliente.
    expect(JSON.stringify(res.body)).not.toContain('ECONNRESET');
    expect(res.body.error).toBe('Token inválido');
  });

  it('TC-SEC-A10-002: si supabase.auth.signUp lanza (servicio no disponible), signup() devuelve 503 controlado', async () => {
    supabase.auth.signUp.mockRejectedValue(new Error('service unavailable'));

    await expect(authService.signup(DATOS_SIGNUP)).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('no está disponible'),
    });
    // No se crea ningún perfil si el proveedor de auth falla.
    expect(Usuario.create).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Rate limit de Supabase
// ═══════════════════════════════════════════════════════════════════════════

describe('A10 — Rate limit de Supabase', () => {
  it('TC-SEC-A10-003: un 429 de Supabase en signup se traduce a 429 con mensaje claro', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email rate limit exceeded', status: 429 },
    });

    await expect(authService.signup(DATOS_SIGNUP)).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining('límite'),
    });
    expect(Usuario.create).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Base de datos no disponible
// ═══════════════════════════════════════════════════════════════════════════

describe('A10 — Base de datos no disponible', () => {
  it('TC-SEC-A10-004: un ConnectionError de Sequelize en un endpoint devuelve 503, no un stack trace', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosRepo.listarPorJugador.mockRejectedValue(
      new ConnectionError(new Error('ECONNREFUSED 127.0.0.1:5432')),
    );

    const res = await request(app)
      .get('/api/mazos')
      .set('Authorization', 'Bearer mock-token-jugador');

    expect(res.status).toBe(503);
    expect(res.body).not.toHaveProperty('stack');
    expect(typeof res.body.error).toBe('string');
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
  });

  it('TC-SEC-A10-005: el errorHandler captura ConnectionError y devuelve JSON limpio (503)', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    const err = new ConnectionError(new Error('password authentication failed for user "postgres"'));

    errorHandler(err, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0][0];
    expect(Object.keys(body)).toEqual(['error']);
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain('password authentication failed');
  });

  it('TC-SEC-A10-006: el errorHandler devuelve JSON limpio (solo "error", sin stack) para errores genéricos', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    const err = Object.assign(new Error('Conflicto de negocio'), { status: 409 });

    errorHandler(err, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    const body = res.json.mock.calls[0][0];
    expect(Object.keys(body)).toEqual(['error']);
    expect(body).not.toHaveProperty('stack');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Degradación / timeout de un servicio externo (IA)
// ═══════════════════════════════════════════════════════════════════════════

describe('A10 — Degradación de servicio externo', () => {
  it('TC-SEC-A10-007: si el servicio de IA tarda/falla (timeout), recomendarCartas degrada con gracia (no rompe el endpoint)', async () => {
    mazosRepo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      nombre: 'Mi mazo',
      MazoCartas: [
        { carta_id: 'carta-1', Carta: { embedding: JSON.stringify([0.1, 0.2, 0.3]) } },
      ],
    });
    mazosRepo.buscarRecomendaciones.mockResolvedValue([{ id: 'rec-1', nombre: 'Sol Ring' }]);
    // Simula un timeout del proveedor de IA.
    openrouter.generateExplanation.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

    const resultado = await mazosService.recomendarCartas('mazo-1', JUGADOR_TEST.id);

    // El endpoint sigue devolviendo las recomendaciones; la explicación (opcional)
    // queda en null en lugar de propagar un 500.
    expect(resultado.recomendaciones).toEqual([{ id: 'rec-1', nombre: 'Sol Ring' }]);
    expect(resultado.explicacion).toBeNull();
  });
});
