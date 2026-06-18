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

vi.mock('../../src/modules/torneos/torneos.service.js', () => ({
  listar: vi.fn(),
  crear: vi.fn(),
  obtenerPorId: vi.fn(),
  actualizar: vi.fn(),
  cambiarEstado: vi.fn(),
  inscribir: vi.fn(),
  listarInscripciones: vi.fn(),
  obtenerTablaPosiciones: vi.fn(),
  misTorneos: vi.fn(),
  cancelarInscripcion: vi.fn(),
  listarPendientes: vi.fn(),
  aprobarInscripcion: vi.fn(),
  rechazarInscripcion: vi.fn(),
  obtenerSnapshotInscripcion: vi.fn(),
  cerrarTorneo: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const torneosService = await import('../../src/modules/torneos/torneos.service.js');
const { default: app } = await import('../../src/app.js');

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const BODY_TORNEO_VALIDO = {
  nombre: 'Torneo Test',
  fecha: '2099-12-31T00:00:00.000Z',
  formato: 'STANDARD',
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/torneos
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — GET /api/torneos', () => {
  it('TC-API-007: lista torneos sin autenticación devuelve 200', async () => {
    torneosService.listar.mockResolvedValue([]);

    const res = await request(app).get('/api/torneos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(torneosService.listar).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/torneos/:id
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — GET /api/torneos/:id', () => {
  it('TC-API-021: torneo inexistente devuelve 404', async () => {
    torneosService.obtenerPorId.mockRejectedValue(
      crearErrorConStatus('Torneo no encontrado', 404),
    );

    const res = await request(app).get('/api/torneos/torneo-inexistente');

    expect(res.status).toBe(404);
  });

  it('TC-API-021b: torneo existente devuelve 200', async () => {
    torneosService.obtenerPorId.mockResolvedValue({ id: 'torneo-1', nombre: 'Torneo Test' });

    const res = await request(app).get('/api/torneos/torneo-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('torneo-1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/torneos
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — POST /api/torneos', () => {
  it('TC-API-025: sin token devuelve 401', async () => {
    const res = await request(app).post('/api/torneos').send(BODY_TORNEO_VALIDO);

    expect(res.status).toBe(401);
    expect(torneosService.crear).not.toHaveBeenCalled();
  });

  it('TC-API-003: jugador con body válido devuelve 403 (rol insuficiente)', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);

    const res = await request(app)
      .post('/api/torneos')
      .set('Authorization', TOKEN_JUGADOR)
      .send(BODY_TORNEO_VALIDO);

    expect(res.status).toBe(403);
    expect(torneosService.crear).not.toHaveBeenCalled();
  });

  it('TC-API-006: organizador con body válido devuelve 201', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    torneosService.crear.mockResolvedValue({ id: 'torneo-nuevo', ...BODY_TORNEO_VALIDO });

    const res = await request(app)
      .post('/api/torneos')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send(BODY_TORNEO_VALIDO);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('torneo-nuevo');
    expect(torneosService.crear).toHaveBeenCalledWith(
      ORGANIZADOR_TEST.id,
      expect.objectContaining({ nombre: 'Torneo Test', formato: 'STANDARD' }),
    );
  });

  it('TC-API-009: organizador con body vacío devuelve 400 Zod', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .post('/api/torneos')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    expect(torneosService.crear).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/torneos/:id/estado
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — PATCH /api/torneos/:id/estado', () => {
  it('TC-API-022: sin token devuelve 401', async () => {
    const res = await request(app)
      .patch('/api/torneos/torneo-1/estado')
      .send({ estado: 'en_curso' });

    expect(res.status).toBe(401);
    expect(torneosService.cambiarEstado).not.toHaveBeenCalled();
  });

  it('TC-API-022b: organizador con estado válido llama al service', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    torneosService.cambiarEstado.mockResolvedValue({ id: 'torneo-1', estado: 'en_curso' });

    const res = await request(app)
      .patch('/api/torneos/torneo-1/estado')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({ estado: 'en_curso' });

    expect(res.status).toBe(200);
    expect(torneosService.cambiarEstado).toHaveBeenCalledWith(
      'torneo-1',
      ORGANIZADOR_TEST.id,
      expect.objectContaining({ estado: 'en_curso' }),
    );
  });
});
