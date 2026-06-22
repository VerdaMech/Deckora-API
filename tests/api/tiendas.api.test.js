import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { TIENDA_TEST, JUGADOR_TEST } from '../fixtures/usuarios.fixture.js';
import {
  TOKEN_TIENDA,
  TOKEN_JUGADOR,
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

vi.mock('../../src/modules/tiendas/tiendas.service.js', () => ({
  listarTodas: vi.fn(),
  buscarCercanas: vi.fn(),
  buscarPorId: vi.fn(),
  actualizar: vi.fn(),
  buscarTornesDeTienda: vi.fn(),
}));

// --- Imports mockeados -------------------------------------------------------

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const tiendasService = await import('../../src/modules/tiendas/tiendas.service.js');
const { default: app } = await import('../../src/app.js');

// --- Setup -------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/tiendas
// =============================================================================

describe('tiendas API — GET /api/tiendas', () => {
  it('listar tiendas sin auth devuelve 200', async () => {
    tiendasService.listarTodas.mockResolvedValue([]);

    const res = await request(app).get('/api/tiendas');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(tiendasService.listarTodas).toHaveBeenCalledOnce();
  });
});

// =============================================================================
// GET /api/tiendas/cercanas
// =============================================================================

describe('tiendas API — GET /api/tiendas/cercanas', () => {
  it('con lat y lng validos devuelve 200', async () => {
    tiendasService.buscarCercanas.mockResolvedValue([]);

    const res = await request(app).get('/api/tiendas/cercanas?lat=-33.45&lng=-70.66');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(tiendasService.buscarCercanas).toHaveBeenCalledWith(
      expect.objectContaining({ lat: -33.45, lng: -70.66 }),
    );
  });

  it('sin parametros devuelve 400', async () => {
    const res = await request(app).get('/api/tiendas/cercanas');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Parámetros inválidos');
    expect(tiendasService.buscarCercanas).not.toHaveBeenCalled();
  });
});

// =============================================================================
// GET /api/tiendas/:id
// =============================================================================

describe('tiendas API — GET /api/tiendas/:id', () => {
  it('tienda existente devuelve 200', async () => {
    const tienda = { id: 'tienda-1', nombre_tienda: 'Tienda Test' };
    tiendasService.buscarPorId.mockResolvedValue(tienda);

    const res = await request(app).get('/api/tiendas/tienda-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('tienda-1');
    expect(tiendasService.buscarPorId).toHaveBeenCalledWith('tienda-1');
  });

  it('tienda inexistente devuelve 404', async () => {
    tiendasService.buscarPorId.mockRejectedValue(
      crearErrorConStatus('Tienda no encontrada', 404),
    );

    const res = await request(app).get('/api/tiendas/no-existe');

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// PUT /api/tiendas/:id
// =============================================================================

describe('tiendas API — PUT /api/tiendas/:id', () => {
  it('sin token devuelve 401', async () => {
    const res = await request(app)
      .put('/api/tiendas/tienda-1')
      .send({ nombre_tienda: 'Nuevo Nombre' });

    expect(res.status).toBe(401);
    expect(tiendasService.actualizar).not.toHaveBeenCalled();
  });

  it('usuario autenticado actualiza su propia tienda devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, TIENDA_TEST);
    const tiendaActualizada = { id: TIENDA_TEST.id, nombre_tienda: 'Nuevo Nombre' };
    tiendasService.actualizar.mockResolvedValue(tiendaActualizada);

    const res = await request(app)
      .put(`/api/tiendas/${TIENDA_TEST.id}`)
      .set('Authorization', TOKEN_TIENDA)
      .send({ nombre_tienda: 'Nuevo Nombre' });

    expect(res.status).toBe(200);
    expect(res.body.nombre_tienda).toBe('Nuevo Nombre');
    expect(tiendasService.actualizar).toHaveBeenCalledWith(
      TIENDA_TEST.id,
      expect.objectContaining({ nombre_tienda: 'Nuevo Nombre' }),
    );
  });

  it('usuario autenticado intenta actualizar otra tienda devuelve 403', async () => {
    configurarAuthMock(supabase, Usuario, TIENDA_TEST);

    const res = await request(app)
      .put('/api/tiendas/otra-tienda-id')
      .set('Authorization', TOKEN_TIENDA)
      .send({ nombre_tienda: 'Hack' });

    expect(res.status).toBe(403);
    expect(tiendasService.actualizar).not.toHaveBeenCalled();
  });
});

// =============================================================================
// GET /api/tiendas/:id/torneos
// =============================================================================

describe('tiendas API — GET /api/tiendas/:id/torneos', () => {
  it('lista torneos de tienda sin auth devuelve 200', async () => {
    tiendasService.buscarTornesDeTienda.mockResolvedValue([]);

    const res = await request(app).get('/api/tiendas/tienda-1/torneos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(tiendasService.buscarTornesDeTienda).toHaveBeenCalledWith('tienda-1');
  });
});
