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

vi.mock('../../src/modules/mazos/mazos.service.js', () => ({
  listar: vi.fn(),
  crear: vi.fn(),
  obtenerPorId: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  agregarCarta: vi.fn(),
  actualizarCarta: vi.fn(),
  eliminarCarta: vi.fn(),
  validar: vi.fn(),
  importarLista: vi.fn(),
  autocompletar: vi.fn(),
  recomendarCartas: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const mazosService = await import('../../src/modules/mazos/mazos.service.js');
const { default: app } = await import('../../src/app.js');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/mazos
// ═══════════════════════════════════════════════════════════════════════════

describe('mazos API — GET /api/mazos', () => {
  it('TC-API-017: sin token devuelve 401', async () => {
    const res = await request(app).get('/api/mazos');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Token no provisto/);
  });

  it('TC-API-018: jugador autenticado devuelve 200 con lista de mazos', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.listar.mockResolvedValue([{ id: 'mazo-1', nombre: 'Mi mazo' }]);

    const res = await request(app)
      .get('/api/mazos')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(mazosService.listar).toHaveBeenCalledWith(JUGADOR_TEST.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/mazos
// ═══════════════════════════════════════════════════════════════════════════

describe('mazos API — POST /api/mazos', () => {
  const bodyValido = { nombre: 'Mazo Estándar', formato: 'STANDARD' };

  it('TC-API-002: sin token devuelve 401', async () => {
    const res = await request(app).post('/api/mazos').send(bodyValido);

    expect(res.status).toBe(401);
    expect(mazosService.crear).not.toHaveBeenCalled();
  });

  it('TC-API-014: token de organizador devuelve 403 (rol incorrecto)', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    mazosService.crear.mockResolvedValue({});

    const res = await request(app)
      .post('/api/mazos')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send(bodyValido);

    expect(res.status).toBe(403);
    expect(mazosService.crear).not.toHaveBeenCalled();
  });

  it('TC-API-015: jugador con body válido devuelve 201', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.crear.mockResolvedValue({ id: 'mazo-nuevo', nombre: 'Mazo Estándar' });

    const res = await request(app)
      .post('/api/mazos')
      .set('Authorization', TOKEN_JUGADOR)
      .send(bodyValido);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('mazo-nuevo');
    expect(mazosService.crear).toHaveBeenCalledWith(
      JUGADOR_TEST.id,
      expect.objectContaining({ nombre: 'Mazo Estándar', formato: 'STANDARD' }),
    );
  });

  it('TC-API-016: jugador con body inválido (sin nombre) devuelve 400 Zod', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);

    const res = await request(app)
      .post('/api/mazos')
      .set('Authorization', TOKEN_JUGADOR)
      .send({ formato: 'STANDARD' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    expect(mazosService.crear).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/mazos/:id
// ═══════════════════════════════════════════════════════════════════════════

describe('mazos API — DELETE /api/mazos/:id', () => {
  it('TC-API-019: mazo inexistente devuelve 404', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.eliminar.mockRejectedValue(crearErrorConStatus('Mazo no encontrado', 404));

    const res = await request(app)
      .delete('/api/mazos/mazo-inexistente')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(404);
  });

  it('TC-API-020: eliminación exitosa devuelve 204', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.eliminar.mockResolvedValue(undefined);

    const res = await request(app)
      .delete('/api/mazos/mazo-1')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(204);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/mazos/:id/importar
// ═══════════════════════════════════════════════════════════════════════════

describe('mazos API — POST /api/mazos/:id/importar', () => {
  const bodyImportar = { lista: '4 Llanowar Elves\n2 Giant Growth' };

  it('TC-API-050: sin token devuelve 401', async () => {
    const res = await request(app).post('/api/mazos/mazo-1/importar').send(bodyImportar);

    expect(res.status).toBe(401);
    expect(mazosService.importarLista).not.toHaveBeenCalled();
  });

  it('TC-API-051: jugador importa lista devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.importarLista.mockResolvedValue({ importadas: 6, errores: [] });

    const res = await request(app)
      .post('/api/mazos/mazo-1/importar')
      .set('Authorization', TOKEN_JUGADOR)
      .send(bodyImportar);

    expect(res.status).toBe(200);
    expect(res.body.importadas).toBe(6);
    expect(mazosService.importarLista).toHaveBeenCalledWith(
      'mazo-1',
      JUGADOR_TEST.id,
      bodyImportar.lista,
      undefined,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/mazos/:id/validar
// ═══════════════════════════════════════════════════════════════════════════

describe('mazos API — POST /api/mazos/:id/validar', () => {
  it('TC-API-052: sin token devuelve 401', async () => {
    const res = await request(app).post('/api/mazos/mazo-1/validar');

    expect(res.status).toBe(401);
    expect(mazosService.validar).not.toHaveBeenCalled();
  });

  it('TC-API-053: jugador valida mazo devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.validar.mockResolvedValue({ valido: true, errores: [] });

    const res = await request(app)
      .post('/api/mazos/mazo-1/validar')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(200);
    expect(res.body.valido).toBe(true);
    expect(mazosService.validar).toHaveBeenCalledWith('mazo-1', JUGADOR_TEST.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/mazos/:id/autocompletar
// ═══════════════════════════════════════════════════════════════════════════

describe('mazos API — POST /api/mazos/:id/autocompletar', () => {
  it('TC-API-054: sin token devuelve 401', async () => {
    const res = await request(app).post('/api/mazos/mazo-1/autocompletar');

    expect(res.status).toBe(401);
    expect(mazosService.autocompletar).not.toHaveBeenCalled();
  });

  it('TC-API-055: jugador autocompleta mazo devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.autocompletar.mockResolvedValue({ agregadas: 5, cartas: [] });

    const res = await request(app)
      .post('/api/mazos/mazo-1/autocompletar')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(200);
    expect(res.body.agregadas).toBe(5);
    expect(mazosService.autocompletar).toHaveBeenCalledWith('mazo-1', JUGADOR_TEST.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/mazos/:id/recomendaciones
// ═══════════════════════════════════════════════════════════════════════════

describe('mazos API — GET /api/mazos/:id/recomendaciones', () => {
  it('TC-API-056: sin token devuelve 401', async () => {
    const res = await request(app).get('/api/mazos/mazo-1/recomendaciones');

    expect(res.status).toBe(401);
    expect(mazosService.recomendarCartas).not.toHaveBeenCalled();
  });

  it('TC-API-057: jugador obtiene recomendaciones devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.recomendarCartas.mockResolvedValue([
      { id: 'carta-1', nombre: 'Lightning Bolt' },
    ]);

    const res = await request(app)
      .get('/api/mazos/mazo-1/recomendaciones')
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].nombre).toBe('Lightning Bolt');
    expect(mazosService.recomendarCartas).toHaveBeenCalledWith('mazo-1', JUGADOR_TEST.id);
  });
});
