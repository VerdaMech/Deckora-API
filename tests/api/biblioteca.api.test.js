import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

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

vi.mock('../../src/modules/biblioteca/biblioteca.service.js', () => ({
  listarCartas: vi.fn(),
  listarSets: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const bibliotecaService = await import('../../src/modules/biblioteca/biblioteca.service.js');
const { default: app } = await import('../../src/app.js');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/biblioteca/cartas — endpoint público
// ═══════════════════════════════════════════════════════════════════════════

describe('biblioteca API — GET /api/biblioteca/cartas', () => {
  it('TC-API-008: devuelve 200 sin necesidad de autenticación', async () => {
    bibliotecaService.listarCartas.mockResolvedValue({ cartas: [], total: 0 });

    const res = await request(app).get('/api/biblioteca/cartas');

    expect(res.status).toBe(200);
    expect(bibliotecaService.listarCartas).toHaveBeenCalledOnce();
  });

  it('TC-API-023: acepta query params de filtro sin error', async () => {
    bibliotecaService.listarCartas.mockResolvedValue({ cartas: [], total: 0 });

    const res = await request(app)
      .get('/api/biblioteca/cartas')
      .query({ q: 'lightning', tipo: 'Instant' });

    expect(res.status).toBe(200);
    expect(bibliotecaService.listarCartas).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/biblioteca/sets — endpoint público
// ═══════════════════════════════════════════════════════════════════════════

describe('biblioteca API — GET /api/biblioteca/sets', () => {
  it('TC-API-024: devuelve 200 sin autenticación', async () => {
    bibliotecaService.listarSets.mockResolvedValue([{ id: 'set-1', nombre: 'Core Set' }]);

    const res = await request(app).get('/api/biblioteca/sets');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(bibliotecaService.listarSets).toHaveBeenCalledOnce();
  });
});
