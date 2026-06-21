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

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/torneos/:id/inscripciones
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — GET /api/torneos/:id/inscripciones', () => {
  it('TC-API-030: lista inscripciones sin autenticación devuelve 200', async () => {
    torneosService.listarInscripciones.mockResolvedValue([
      { id: 'insc-1', jugador_id: 'j1' },
    ]);

    const res = await request(app).get('/api/torneos/torneo-1/inscripciones');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(torneosService.listarInscripciones).toHaveBeenCalledWith('torneo-1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/torneos/:id/tabla-posiciones
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — GET /api/torneos/:id/tabla-posiciones', () => {
  it('TC-API-031: tabla de posiciones sin autenticación devuelve 200', async () => {
    torneosService.obtenerTablaPosiciones.mockResolvedValue([
      { posicion: 1, jugador: 'j1', puntos: 9 },
    ]);

    const res = await request(app).get('/api/torneos/torneo-1/tabla-posiciones');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(torneosService.obtenerTablaPosiciones).toHaveBeenCalledWith('torneo-1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/torneos/mis-torneos
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — GET /api/torneos/mis-torneos', () => {
  it('TC-API-032: sin token devuelve 401', async () => {
    const res = await request(app).get('/api/torneos/mis-torneos');

    expect(res.status).toBe(401);
    expect(torneosService.misTorneos).not.toHaveBeenCalled();
  });

  it('TC-API-033: organizador autenticado devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    torneosService.misTorneos.mockResolvedValue([{ id: 'torneo-1', nombre: 'Mi Torneo' }]);

    const res = await request(app)
      .get('/api/torneos/mis-torneos')
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(torneosService.misTorneos).toHaveBeenCalledWith(ORGANIZADOR_TEST.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/torneos/:id/inscripciones/:inscripcionId
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — DELETE /api/torneos/:id/inscripciones/:inscripcionId', () => {
  it('TC-API-034: sin token devuelve 401', async () => {
    const res = await request(app).delete('/api/torneos/torneo-1/inscripciones/insc-1');

    expect(res.status).toBe(401);
    expect(torneosService.cancelarInscripcion).not.toHaveBeenCalled();
  });

  it('TC-API-035: jugador autenticado cancela inscripción devuelve 204', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    torneosService.cancelarInscripcion.mockResolvedValue(undefined);

    const res = await request(app)
      .delete('/api/torneos/torneo-1/inscripciones/insc-1')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(204);
    expect(torneosService.cancelarInscripcion).toHaveBeenCalledWith(
      'torneo-1',
      'insc-1',
      JUGADOR_TEST.id,
      JUGADOR_TEST.rol,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/torneos/:id/inscripciones/pendientes
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — GET /api/torneos/:id/inscripciones/pendientes', () => {
  it('TC-API-036: sin token devuelve 401', async () => {
    const res = await request(app).get('/api/torneos/torneo-1/inscripciones/pendientes');

    expect(res.status).toBe(401);
    expect(torneosService.listarPendientes).not.toHaveBeenCalled();
  });

  it('TC-API-037: organizador autenticado devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    torneosService.listarPendientes.mockResolvedValue([{ id: 'insc-2', estado: 'pendiente' }]);

    const res = await request(app)
      .get('/api/torneos/torneo-1/inscripciones/pendientes')
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(torneosService.listarPendientes).toHaveBeenCalledWith('torneo-1', ORGANIZADOR_TEST.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/torneos/:id/inscripciones/:inscripcionId/aprobar
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — PATCH /api/torneos/:id/inscripciones/:inscripcionId/aprobar', () => {
  it('TC-API-038: sin token devuelve 401', async () => {
    const res = await request(app).patch('/api/torneos/torneo-1/inscripciones/insc-1/aprobar');

    expect(res.status).toBe(401);
    expect(torneosService.aprobarInscripcion).not.toHaveBeenCalled();
  });

  it('TC-API-039: organizador aprueba inscripción devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    torneosService.aprobarInscripcion.mockResolvedValue({ id: 'insc-1', estado: 'aprobada' });

    const res = await request(app)
      .patch('/api/torneos/torneo-1/inscripciones/insc-1/aprobar')
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('aprobada');
    expect(torneosService.aprobarInscripcion).toHaveBeenCalledWith(
      'torneo-1',
      'insc-1',
      ORGANIZADOR_TEST.id,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/torneos/:id/inscripciones/:inscripcionId/rechazar
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — DELETE /api/torneos/:id/inscripciones/:inscripcionId/rechazar', () => {
  it('TC-API-040: sin token devuelve 401', async () => {
    const res = await request(app).delete('/api/torneos/torneo-1/inscripciones/insc-1/rechazar');

    expect(res.status).toBe(401);
    expect(torneosService.rechazarInscripcion).not.toHaveBeenCalled();
  });

  it('TC-API-041: organizador rechaza inscripción devuelve 204', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    torneosService.rechazarInscripcion.mockResolvedValue(undefined);

    const res = await request(app)
      .delete('/api/torneos/torneo-1/inscripciones/insc-1/rechazar')
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(204);
    expect(torneosService.rechazarInscripcion).toHaveBeenCalledWith(
      'torneo-1',
      'insc-1',
      ORGANIZADOR_TEST.id,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/torneos/:id/inscripciones/:inscripcionId/snapshot
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — GET /api/torneos/:id/inscripciones/:inscripcionId/snapshot', () => {
  it('TC-API-042: sin token devuelve 401', async () => {
    const res = await request(app).get('/api/torneos/torneo-1/inscripciones/insc-1/snapshot');

    expect(res.status).toBe(401);
    expect(torneosService.obtenerSnapshotInscripcion).not.toHaveBeenCalled();
  });

  it('TC-API-043: organizador obtiene snapshot devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    torneosService.obtenerSnapshotInscripcion.mockResolvedValue({
      mazo: 'snapshot-data',
      cartas: [],
    });

    const res = await request(app)
      .get('/api/torneos/torneo-1/inscripciones/insc-1/snapshot')
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(200);
    expect(res.body.mazo).toBe('snapshot-data');
    expect(torneosService.obtenerSnapshotInscripcion).toHaveBeenCalledWith(
      'torneo-1',
      'insc-1',
      ORGANIZADOR_TEST.id,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/torneos/:id/cerrar
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos API — PATCH /api/torneos/:id/cerrar', () => {
  it('TC-API-044: sin token devuelve 401', async () => {
    const res = await request(app).patch('/api/torneos/torneo-1/cerrar');

    expect(res.status).toBe(401);
    expect(torneosService.cerrarTorneo).not.toHaveBeenCalled();
  });

  it('TC-API-045: organizador cierra torneo devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    torneosService.cerrarTorneo.mockResolvedValue({ id: 'torneo-1', estado: 'finalizado' });

    const res = await request(app)
      .patch('/api/torneos/torneo-1/cerrar')
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('finalizado');
    expect(torneosService.cerrarTorneo).toHaveBeenCalledWith('torneo-1', ORGANIZADOR_TEST.id);
  });
});
