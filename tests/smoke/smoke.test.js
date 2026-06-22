import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// ─── Mocks de infraestructura (previenen efectos secundarios al cargar app.js) ──

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

// ─── Mocks de servicio mínimos ────────────────────────────────────────────────

vi.mock('../../src/modules/biblioteca/biblioteca.service.js', () => ({
  listarCartas: vi.fn().mockResolvedValue({ cartas: [], total: 0 }),
  listarSets: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/modules/torneos/torneos.service.js', () => ({
  listar: vi.fn().mockResolvedValue([]),
  obtenerPorId: vi.fn().mockRejectedValue(
    Object.assign(new Error('Torneo no encontrado'), { status: 404 }),
  ),
  crear: vi.fn(),
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

// ─── App ──────────────────────────────────────────────────────────────────────

const { default: app } = await import('../../src/app.js');

// ═══════════════════════════════════════════════════════════════════════════
// Smoke tests — endpoints vitales
// ═══════════════════════════════════════════════════════════════════════════

describe('Smoke tests — endpoints vitales', () => {
  it('TC-SMK-001: GET /health responde 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('TC-SMK-002: GET /api/biblioteca/cartas responde 200 sin autenticación', async () => {
    const res = await request(app).get('/api/biblioteca/cartas');
    expect(res.status).toBe(200);
  });

  it('TC-SMK-003: GET /api/torneos responde 200 sin autenticación', async () => {
    const res = await request(app).get('/api/torneos');
    expect(res.status).toBe(200);
  });

  it('TC-SMK-004: POST /api/mazos sin token responde 401', async () => {
    const res = await request(app).post('/api/mazos').send({});
    expect(res.status).toBe(401);
  });

  it('TC-SMK-005: GET /api/torneos/:id inexistente responde 404', async () => {
    const res = await request(app).get('/api/torneos/id-inexistente');
    expect(res.status).toBe(404);
  });
});
