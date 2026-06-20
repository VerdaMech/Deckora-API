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

vi.mock('../../src/modules/estadisticas/estadisticas.service.js', () => ({
  obtenerMias: vi.fn(),
  obtenerPublico: vi.fn(),
  obtenerHistorialDiario: vi.fn(),
  obtenerRanking: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const estadisticasService = await import('../../src/modules/estadisticas/estadisticas.service.js');
const { default: app } = await import('../../src/app.js');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/estadisticas/mias
// ═══════════════════════════════════════════════════════════════════════════

describe('estadisticas API — GET /api/estadisticas/mias', () => {
  it('TC-API-EST-001: sin token devuelve 401', async () => {
    const res = await request(app).get('/api/estadisticas/mias');

    expect(res.status).toBe(401);
    expect(estadisticasService.obtenerMias).not.toHaveBeenCalled();
  });

  it('TC-API-EST-002: organizador devuelve 403 (rol insuficiente)', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .get('/api/estadisticas/mias')
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(403);
    expect(estadisticasService.obtenerMias).not.toHaveBeenCalled();
  });

  it('TC-API-EST-003: jugador autenticado devuelve 200 con estadísticas', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    estadisticasService.obtenerMias.mockResolvedValue({
      usuario_id: JUGADOR_TEST.id,
      partidas_ganadas: 10,
      partidas_perdidas: 5,
      partidas_empatadas: 2,
      torneos_participados: 3,
      total_partidas: 17,
      porcentaje_victorias: '58.8',
    });

    const res = await request(app)
      .get('/api/estadisticas/mias')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(200);
    expect(res.body.usuario_id).toBe(JUGADOR_TEST.id);
    expect(res.body.partidas_ganadas).toBe(10);
    expect(estadisticasService.obtenerMias).toHaveBeenCalledWith(JUGADOR_TEST.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/estadisticas/ranking
// ═══════════════════════════════════════════════════════════════════════════

describe('estadisticas API — GET /api/estadisticas/ranking', () => {
  it('TC-API-EST-004: endpoint público devuelve 200 con ranking', async () => {
    estadisticasService.obtenerRanking.mockResolvedValue([
      { usuario_id: 'j1', partidas_ganadas: 20, puntos_totales: 62, posicion: 1 },
      { usuario_id: 'j2', partidas_ganadas: 15, puntos_totales: 48, posicion: 2 },
    ]);

    const res = await request(app).get('/api/estadisticas/ranking');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].posicion).toBe(1);
    expect(estadisticasService.obtenerRanking).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/estadisticas/jugadores/:jugadorId
// ═══════════════════════════════════════════════════════════════════════════

describe('estadisticas API — GET /api/estadisticas/jugadores/:jugadorId', () => {
  it('TC-API-EST-005: jugador existente devuelve 200 con estadísticas públicas', async () => {
    estadisticasService.obtenerPublico.mockResolvedValue({
      usuario_id: 'jugador-uuid-001',
      partidas_ganadas: 8,
      partidas_perdidas: 3,
      partidas_empatadas: 1,
      total_partidas: 12,
      porcentaje_victorias: '66.7',
      historialUltimosMeses: [],
      mazoMasJugado: null,
    });

    const res = await request(app).get('/api/estadisticas/jugadores/jugador-uuid-001');

    expect(res.status).toBe(200);
    expect(res.body.usuario_id).toBe('jugador-uuid-001');
    expect(res.body.partidas_ganadas).toBe(8);
    expect(estadisticasService.obtenerPublico).toHaveBeenCalledWith('jugador-uuid-001');
  });

  it('TC-API-EST-006: jugador inexistente devuelve 404', async () => {
    estadisticasService.obtenerPublico.mockRejectedValue(
      crearErrorConStatus('Jugador no encontrado', 404),
    );

    const res = await request(app).get('/api/estadisticas/jugadores/no-existe');

    expect(res.status).toBe(404);
    expect(estadisticasService.obtenerPublico).toHaveBeenCalledWith('no-existe');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/estadisticas/jugadores/:jugadorId/historial-diario
// ═══════════════════════════════════════════════════════════════════════════

describe('estadisticas API — GET /api/estadisticas/jugadores/:jugadorId/historial-diario', () => {
  it('TC-API-EST-007: devuelve 200 con historial diario para un mes válido', async () => {
    estadisticasService.obtenerHistorialDiario.mockResolvedValue([
      { fecha: '2099-06-01', partidas_ganadas: 2, partidas_perdidas: 1 },
      { fecha: '2099-06-02', partidas_ganadas: 1, partidas_perdidas: 0 },
    ]);

    const res = await request(app)
      .get('/api/estadisticas/jugadores/jugador-uuid-001/historial-diario')
      .query({ mes: '2099-06' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(estadisticasService.obtenerHistorialDiario).toHaveBeenCalledWith(
      'jugador-uuid-001',
      '2099-06',
    );
  });
});
