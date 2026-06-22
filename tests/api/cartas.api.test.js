import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { crearErrorConStatus } from '../helpers/api.helper.js';

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

vi.mock('../../src/modules/cartas/cartas.service.js', () => ({
  buscarEnBD: vi.fn(),
  listar: vi.fn(),
  obtenerPorScryfallId: vi.fn(),
}));

// --- Imports mockeados -------------------------------------------------------

const cartasService = await import('../../src/modules/cartas/cartas.service.js');
const { default: app } = await import('../../src/app.js');

// --- Setup -------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// GET /api/cartas/buscar
// =============================================================================

describe('cartas API — GET /api/cartas/buscar', () => {
  it('buscar con q devuelve 200 y resultados', async () => {
    const cartasMock = [{ id: 'c1', nombre: 'Lightning Bolt' }];
    cartasService.buscarEnBD.mockResolvedValue(cartasMock);

    const res = await request(app).get('/api/cartas/buscar?q=lightning');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(cartasMock);
    expect(cartasService.buscarEnBD).toHaveBeenCalledWith('lightning', null);
  });

  it('buscar con q y formato valido pasa el formato al service', async () => {
    cartasService.buscarEnBD.mockResolvedValue([]);

    const res = await request(app).get('/api/cartas/buscar?q=bolt&formato=standard');

    expect(res.status).toBe(200);
    expect(cartasService.buscarEnBD).toHaveBeenCalledWith('bolt', 'STANDARD');
  });

  it('buscar sin q devuelve 400', async () => {
    const res = await request(app).get('/api/cartas/buscar');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('El parámetro q es requerido');
    expect(cartasService.buscarEnBD).not.toHaveBeenCalled();
  });

  it('buscar con formato invalido ignora el formato', async () => {
    cartasService.buscarEnBD.mockResolvedValue([]);

    const res = await request(app).get('/api/cartas/buscar?q=bolt&formato=INVALIDO');

    expect(res.status).toBe(200);
    expect(cartasService.buscarEnBD).toHaveBeenCalledWith('bolt', null);
  });
});

// =============================================================================
// GET /api/cartas
// =============================================================================

describe('cartas API — GET /api/cartas', () => {
  it('listar devuelve 200 con datos paginados', async () => {
    const resultado = { count: 50, rows: [{ id: 'c1' }, { id: 'c2' }] };
    cartasService.listar.mockResolvedValue(resultado);

    const res = await request(app).get('/api/cartas');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(50);
    expect(res.body.cartas).toHaveLength(2);
    expect(cartasService.listar).toHaveBeenCalledWith({ page: 1, limit: undefined });
  });

  it('listar con page y limit los pasa al service', async () => {
    cartasService.listar.mockResolvedValue({ count: 0, rows: [] });

    const res = await request(app).get('/api/cartas?page=3&limit=10');

    expect(res.status).toBe(200);
    expect(cartasService.listar).toHaveBeenCalledWith({ page: 3, limit: 10 });
  });
});

// =============================================================================
// GET /api/cartas/:scryfallId
// =============================================================================

describe('cartas API — GET /api/cartas/:scryfallId', () => {
  it('carta existente devuelve 200', async () => {
    const carta = { scryfall_id: 'abc-123', nombre: 'Lightning Bolt' };
    cartasService.obtenerPorScryfallId.mockResolvedValue(carta);

    const res = await request(app).get('/api/cartas/abc-123');

    expect(res.status).toBe(200);
    expect(res.body.scryfall_id).toBe('abc-123');
    expect(cartasService.obtenerPorScryfallId).toHaveBeenCalledWith('abc-123');
  });

  it('carta inexistente devuelve 404', async () => {
    cartasService.obtenerPorScryfallId.mockRejectedValue(
      crearErrorConStatus('Carta no encontrada', 404),
    );

    const res = await request(app).get('/api/cartas/no-existe');

    expect(res.status).toBe(404);
  });
});
