import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { JUGADOR_TEST } from '../fixtures/usuarios.fixture.js';
import {
  TOKEN_JUGADOR,
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

vi.mock('../../src/modules/usuarios/usuarios.service.js', () => ({
  obtenerPorUsername: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const usuariosService = await import('../../src/modules/usuarios/usuarios.service.js');
const { default: app } = await import('../../src/app.js');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/usuarios/:username
// ═══════════════════════════════════════════════════════════════════════════

describe('usuarios API — GET /api/usuarios/:username', () => {
  it('TC-API-USR-001: usuario existente devuelve 200 con perfil', async () => {
    const perfilEsperado = {
      id: JUGADOR_TEST.id,
      nombre_usuario: JUGADOR_TEST.nombre_usuario,
      correo: 'test@example.com',
      rol: 'jugador',
    };
    usuariosService.obtenerPorUsername.mockResolvedValue(perfilEsperado);

    const res = await request(app).get('/api/usuarios/jugador_test');

    expect(res.status).toBe(200);
    expect(res.body.nombre_usuario).toBe('jugador_test');
    expect(usuariosService.obtenerPorUsername).toHaveBeenCalledWith('jugador_test');
  });

  it('TC-API-USR-002: usuario inexistente devuelve 404', async () => {
    usuariosService.obtenerPorUsername.mockRejectedValue(
      crearErrorConStatus('Usuario no encontrado', 404),
    );

    const res = await request(app).get('/api/usuarios/no_existe');

    expect(res.status).toBe(404);
    expect(usuariosService.obtenerPorUsername).toHaveBeenCalledWith('no_existe');
  });

  it('TC-API-USR-003: endpoint es público, no requiere autenticación', async () => {
    const perfilEsperado = {
      id: JUGADOR_TEST.id,
      nombre_usuario: JUGADOR_TEST.nombre_usuario,
      rol: 'jugador',
    };
    usuariosService.obtenerPorUsername.mockResolvedValue(perfilEsperado);

    // Sin token de autorización
    const res = await request(app).get('/api/usuarios/jugador_test');

    expect(res.status).toBe(200);
    expect(res.body.nombre_usuario).toBe('jugador_test');
  });
});
