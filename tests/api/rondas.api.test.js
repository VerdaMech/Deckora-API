import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { JUGADOR_TEST, ORGANIZADOR_TEST, TIENDA_TEST } from '../fixtures/usuarios.fixture.js';
import {
  TOKEN_JUGADOR,
  TOKEN_ORGANIZADOR,
  TOKEN_TIENDA,
  configurarAuthMock,
  crearErrorConStatus,
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

vi.mock('../../src/modules/rondas/rondas.service.js', () => ({
  crearRonda: vi.fn(),
  listarRondasDeTorneo: vi.fn(),
  obtenerRonda: vi.fn(),
  eliminarRonda: vi.fn(),
}));

// --- Imports mockeados -------------------------------------------------------

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const rondasService = await import('../../src/modules/rondas/rondas.service.js');
const { default: app } = await import('../../src/app.js');

// --- Datos de prueba ---------------------------------------------------------

const TORNEO_ID = 'torneo-uuid-001';
const RONDA_ID = 'ronda-uuid-001';

const BODY_RONDA_VALIDO = {
  tipo_ronda: 'swiss',
};

// --- Setup -------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// POST /api/torneos/:torneoId/rondas
// =============================================================================

describe('rondas API — POST /api/torneos/:torneoId/rondas', () => {
  it('sin token devuelve 401', async () => {
    const res = await request(app)
      .post(`/api/torneos/${TORNEO_ID}/rondas`)
      .send(BODY_RONDA_VALIDO);

    expect(res.status).toBe(401);
    expect(rondasService.crearRonda).not.toHaveBeenCalled();
  });

  it('autenticado con body valido devuelve 201', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    const rondaMock = { id: RONDA_ID, tipo_ronda: 'swiss', numero: 1 };
    rondasService.crearRonda.mockResolvedValue(rondaMock);

    const res = await request(app)
      .post(`/api/torneos/${TORNEO_ID}/rondas`)
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send(BODY_RONDA_VALIDO);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(RONDA_ID);
    expect(rondasService.crearRonda).toHaveBeenCalledWith(
      TORNEO_ID,
      expect.objectContaining({ tipo_ronda: 'swiss' }),
      ORGANIZADOR_TEST.id,
    );
  });

  it('body con tipo_ronda invalido devuelve 400 (validacion Zod)', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .post(`/api/torneos/${TORNEO_ID}/rondas`)
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({ tipo_ronda: 'invalido' });

    expect(res.status).toBe(400);
    expect(rondasService.crearRonda).not.toHaveBeenCalled();
  });
});

// =============================================================================
// GET /api/torneos/:torneoId/rondas
// =============================================================================

describe('rondas API — GET /api/torneos/:torneoId/rondas', () => {
  it('listar rondas sin auth devuelve 200', async () => {
    rondasService.listarRondasDeTorneo.mockResolvedValue([]);

    const res = await request(app).get(`/api/torneos/${TORNEO_ID}/rondas`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(rondasService.listarRondasDeTorneo).toHaveBeenCalledWith(TORNEO_ID);
  });
});

// =============================================================================
// GET /api/torneos/:torneoId/rondas/:rondaId
// =============================================================================

describe('rondas API — GET /api/torneos/:torneoId/rondas/:rondaId', () => {
  it('ronda existente devuelve 200', async () => {
    const rondaMock = { id: RONDA_ID, tipo_ronda: 'swiss', numero: 1 };
    rondasService.obtenerRonda.mockResolvedValue(rondaMock);

    const res = await request(app).get(`/api/torneos/${TORNEO_ID}/rondas/${RONDA_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(RONDA_ID);
    expect(rondasService.obtenerRonda).toHaveBeenCalledWith(RONDA_ID);
  });

  it('ronda inexistente devuelve 404', async () => {
    rondasService.obtenerRonda.mockRejectedValue(
      crearErrorConStatus('Ronda no encontrada', 404),
    );

    const res = await request(app).get(`/api/torneos/${TORNEO_ID}/rondas/no-existe`);

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/torneos/:torneoId/rondas/:rondaId
// =============================================================================

describe('rondas API — DELETE /api/torneos/:torneoId/rondas/:rondaId', () => {
  it('sin token devuelve 401', async () => {
    const res = await request(app).delete(`/api/torneos/${TORNEO_ID}/rondas/${RONDA_ID}`);

    expect(res.status).toBe(401);
    expect(rondasService.eliminarRonda).not.toHaveBeenCalled();
  });

  it('jugador (rol insuficiente) devuelve 403', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);

    const res = await request(app)
      .delete(`/api/torneos/${TORNEO_ID}/rondas/${RONDA_ID}`)
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(403);
    expect(rondasService.eliminarRonda).not.toHaveBeenCalled();
  });

  it('organizador puede eliminar ronda (204)', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    rondasService.eliminarRonda.mockResolvedValue(undefined);

    const res = await request(app)
      .delete(`/api/torneos/${TORNEO_ID}/rondas/${RONDA_ID}`)
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(204);
    expect(rondasService.eliminarRonda).toHaveBeenCalledWith(
      TORNEO_ID,
      RONDA_ID,
      ORGANIZADOR_TEST.id,
    );
  });

  it('tienda puede eliminar ronda (204)', async () => {
    configurarAuthMock(supabase, Usuario, TIENDA_TEST);
    rondasService.eliminarRonda.mockResolvedValue(undefined);

    const res = await request(app)
      .delete(`/api/torneos/${TORNEO_ID}/rondas/${RONDA_ID}`)
      .set('Authorization', TOKEN_TIENDA);

    expect(res.status).toBe(204);
    expect(rondasService.eliminarRonda).toHaveBeenCalledWith(
      TORNEO_ID,
      RONDA_ID,
      TIENDA_TEST.id,
    );
  });
});
