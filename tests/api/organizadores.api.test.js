import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { JUGADOR_TEST, ORGANIZADOR_TEST } from '../fixtures/usuarios.fixture.js';
import {
  TOKEN_JUGADOR,
  TOKEN_ORGANIZADOR,
  configurarAuthMock,
} from '../helpers/api.helper.js';

// --- Mocks de modulos --------------------------------------------------------

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

vi.mock('../../src/modules/organizadores/organizadores.service.js', () => ({
  obtenerMio: vi.fn(),
  actualizarMio: vi.fn(),
}));

// --- Imports mockeados -------------------------------------------------------

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const organizadoresService = await import('../../src/modules/organizadores/organizadores.service.js');
const { default: app } = await import('../../src/app.js');

// --- Setup -------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/organizadores/me
// =============================================================================

describe('organizadores API — GET /api/organizadores/me', () => {
  it('sin token devuelve 401', async () => {
    const res = await request(app).get('/api/organizadores/me');

    expect(res.status).toBe(401);
    expect(organizadoresService.obtenerMio).not.toHaveBeenCalled();
  });

  it('jugador (rol insuficiente) devuelve 403', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);

    const res = await request(app)
      .get('/api/organizadores/me')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(403);
    expect(organizadoresService.obtenerMio).not.toHaveBeenCalled();
  });

  it('organizador obtiene su perfil devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    const perfilMock = { usuario_id: ORGANIZADOR_TEST.id, descripcion: 'Org test' };
    organizadoresService.obtenerMio.mockResolvedValue(perfilMock);

    const res = await request(app)
      .get('/api/organizadores/me')
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(200);
    expect(res.body.usuario_id).toBe(ORGANIZADOR_TEST.id);
    expect(organizadoresService.obtenerMio).toHaveBeenCalledWith(ORGANIZADOR_TEST.id);
  });
});

// =============================================================================
// PATCH /api/organizadores/me
// =============================================================================

describe('organizadores API — PATCH /api/organizadores/me', () => {
  it('sin token devuelve 401', async () => {
    const res = await request(app)
      .patch('/api/organizadores/me')
      .send({ descripcion: 'nueva' });

    expect(res.status).toBe(401);
    expect(organizadoresService.actualizarMio).not.toHaveBeenCalled();
  });

  it('jugador (rol insuficiente) devuelve 403', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);

    const res = await request(app)
      .patch('/api/organizadores/me')
      .set('Authorization', TOKEN_JUGADOR)
      .send({ descripcion: 'nueva' });

    expect(res.status).toBe(403);
    expect(organizadoresService.actualizarMio).not.toHaveBeenCalled();
  });

  it('organizador con body valido devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    const perfilActualizado = { usuario_id: ORGANIZADOR_TEST.id, descripcion: 'actualizada' };
    organizadoresService.actualizarMio.mockResolvedValue(perfilActualizado);

    const res = await request(app)
      .patch('/api/organizadores/me')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({ descripcion: 'actualizada' });

    expect(res.status).toBe(200);
    expect(res.body.descripcion).toBe('actualizada');
    expect(organizadoresService.actualizarMio).toHaveBeenCalledWith(
      ORGANIZADOR_TEST.id,
      expect.objectContaining({ descripcion: 'actualizada' }),
    );
  });

  it('organizador con body vacio devuelve 400', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .patch('/api/organizadores/me')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
    expect(organizadoresService.actualizarMio).not.toHaveBeenCalled();
  });
});
