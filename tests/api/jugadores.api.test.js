import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { JUGADOR_TEST, ORGANIZADOR_TEST } from '../fixtures/usuarios.fixture.js';
import {
  TOKEN_JUGADOR,
  TOKEN_ORGANIZADOR,
  configurarAuthMock,
  crearErrorConStatus,
} from '../helpers/api.helper.js';

// ─── Mocks de módulos ─────────────────────────────────────────────────────────

vi.mock('../../src/config/supabase.js', () => ({
  default: { auth: { getUser: vi.fn() } },
}));

vi.mock('../../src/config/db.js', () => ({
  default: { transaction: vi.fn(), query: vi.fn() },
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

vi.mock('../../src/modules/notificaciones/email.service.js', () => ({
  notificarSolicitudInscripcion: vi.fn(),
  notificarInscripcionAceptada: vi.fn(),
  notificarInscripcionRechazada: vi.fn(),
}));

vi.mock('../../src/modules/jugadores/jugadores.service.js', () => ({
  misTorneos: vi.fn(),
  misInscripciones: vi.fn(),
}));

vi.mock('../../src/modules/mazos/mazos.repository.js', () => ({
  listarPublicosPorJugador: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const jugadoresService = await import('../../src/modules/jugadores/jugadores.service.js');
const mazosRepo = await import('../../src/modules/mazos/mazos.repository.js');
const { default: app } = await import('../../src/app.js');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/jugadores/me/torneos
// ═══════════════════════════════════════════════════════════════════════════

describe('jugadores API — GET /api/jugadores/me/torneos', () => {
  it('TC-API-JUG-001: sin token devuelve 401', async () => {
    const res = await request(app).get('/api/jugadores/me/torneos');

    expect(res.status).toBe(401);
    expect(jugadoresService.misTorneos).not.toHaveBeenCalled();
  });

  it('TC-API-JUG-002: organizador devuelve 403 (rol insuficiente)', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .get('/api/jugadores/me/torneos')
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(403);
    expect(jugadoresService.misTorneos).not.toHaveBeenCalled();
  });

  it('TC-API-JUG-003: jugador autenticado devuelve 200 con torneos', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    jugadoresService.misTorneos.mockResolvedValue([
      { id: 'torneo-1', nombre: 'Torneo Alpha' },
    ]);

    const res = await request(app)
      .get('/api/jugadores/me/torneos')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe('torneo-1');
    expect(jugadoresService.misTorneos).toHaveBeenCalledWith(
      JUGADOR_TEST.id,
      undefined,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/jugadores/me/inscripciones
// ═══════════════════════════════════════════════════════════════════════════

describe('jugadores API — GET /api/jugadores/me/inscripciones', () => {
  it('TC-API-JUG-004: sin token devuelve 401', async () => {
    const res = await request(app).get('/api/jugadores/me/inscripciones');

    expect(res.status).toBe(401);
    expect(jugadoresService.misInscripciones).not.toHaveBeenCalled();
  });

  it('TC-API-JUG-005: jugador autenticado devuelve 200 con inscripciones', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    jugadoresService.misInscripciones.mockResolvedValue([
      {
        inscripcion: { id: 'ins-1', fecha_inscripcion: '2099-01-01', confirmado: true, mazo: null },
        torneo: { id: 'torneo-1', nombre: 'Torneo Alpha' },
      },
    ]);

    const res = await request(app)
      .get('/api/jugadores/me/inscripciones')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].inscripcion.id).toBe('ins-1');
    expect(jugadoresService.misInscripciones).toHaveBeenCalledWith(JUGADOR_TEST.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/jugadores/:id/mazos
// ═══════════════════════════════════════════════════════════════════════════

describe('jugadores API — GET /api/jugadores/:id/mazos', () => {
  it('TC-API-JUG-006: endpoint público devuelve 200 con mazos', async () => {
    mazosRepo.listarPublicosPorJugador.mockResolvedValue([
      { id: 'mazo-1', nombre: 'Mazo Fire', formato: 'STANDARD', slug: 'mazo-fire' },
    ]);

    const res = await request(app).get('/api/jugadores/jugador-uuid-001/mazos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe('mazo-1');
    expect(mazosRepo.listarPublicosPorJugador).toHaveBeenCalledWith('jugador-uuid-001');
  });
});
