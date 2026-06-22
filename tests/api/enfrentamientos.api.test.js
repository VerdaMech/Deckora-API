import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { ORGANIZADOR_TEST } from '../fixtures/usuarios.fixture.js';
import {
  TOKEN_ORGANIZADOR,
  configurarAuthMock,
  crearErrorConStatus,
} from '../helpers/api.helper.js';

// ─── Mocks de módulos ──────────────────────────────────────────────────────────

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

vi.mock('../../src/modules/enfrentamientos/enfrentamientos.service.js', () => ({
  obtenerEnfrentamiento: vi.fn(),
  registrarResultado: vi.fn(),
  cambiarEstado: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const enfrentamientosService = await import(
  '../../src/modules/enfrentamientos/enfrentamientos.service.js'
);
const { default: app } = await import('../../src/app.js');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/enfrentamientos/:id
// ═══════════════════════════════════════════════════════════════════════════════

describe('enfrentamientos API — GET /api/enfrentamientos/:id', () => {
  it('TC-API-ENF-001: enfrentamiento existente devuelve 200 con datos', async () => {
    const datos = { id: 'enf-1', estado: 'pendiente' };
    enfrentamientosService.obtenerEnfrentamiento.mockResolvedValue(datos);

    const res = await request(app).get('/api/enfrentamientos/enf-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('enf-1');
    expect(enfrentamientosService.obtenerEnfrentamiento).toHaveBeenCalledWith('enf-1');
  });

  it('TC-API-ENF-002: enfrentamiento inexistente devuelve 404', async () => {
    enfrentamientosService.obtenerEnfrentamiento.mockRejectedValue(
      crearErrorConStatus('Enfrentamiento no encontrado', 404),
    );

    const res = await request(app).get('/api/enfrentamientos/no-existe');

    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/enfrentamientos/:id/resultado
// ═══════════════════════════════════════════════════════════════════════════════

describe('enfrentamientos API — PATCH /api/enfrentamientos/:id/resultado', () => {
  const bodyValido = {
    resultados: [
      { inscripcion_id: '550e8400-e29b-41d4-a716-446655440001', resultado: 'ganador' },
      { inscripcion_id: '550e8400-e29b-41d4-a716-446655440002', resultado: 'derrota' },
    ],
  };

  it('TC-API-ENF-003: sin token devuelve 401', async () => {
    const res = await request(app).patch('/api/enfrentamientos/enf-1/resultado').send(bodyValido);

    expect(res.status).toBe(401);
    expect(enfrentamientosService.registrarResultado).not.toHaveBeenCalled();
  });

  it('TC-API-ENF-004: body con resultados vacíos devuelve 400 Zod', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .patch('/api/enfrentamientos/enf-1/resultado')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({ resultados: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    expect(enfrentamientosService.registrarResultado).not.toHaveBeenCalled();
  });

  it('TC-API-ENF-005: body sin resultados devuelve 400 Zod', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .patch('/api/enfrentamientos/enf-1/resultado')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({});

    expect(res.status).toBe(400);
    expect(enfrentamientosService.registrarResultado).not.toHaveBeenCalled();
  });

  it('TC-API-ENF-006: organizador con body válido llama al servicio y devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    enfrentamientosService.registrarResultado.mockResolvedValue({ id: 'enf-1', estado: 'finalizado' });

    const res = await request(app)
      .patch('/api/enfrentamientos/enf-1/resultado')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send(bodyValido);

    expect(res.status).toBe(200);
    expect(enfrentamientosService.registrarResultado).toHaveBeenCalledWith(
      'enf-1',
      expect.objectContaining({ resultados: bodyValido.resultados }),
      ORGANIZADOR_TEST.id,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/enfrentamientos/:id/estado
// ═══════════════════════════════════════════════════════════════════════════════

describe('enfrentamientos API — PATCH /api/enfrentamientos/:id/estado', () => {
  it('TC-API-ENF-007: sin token devuelve 401', async () => {
    const res = await request(app)
      .patch('/api/enfrentamientos/enf-1/estado')
      .send({ estado: 'en_curso' });

    expect(res.status).toBe(401);
    expect(enfrentamientosService.cambiarEstado).not.toHaveBeenCalled();
  });

  it('TC-API-ENF-008: estado inválido devuelve 400 Zod', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .patch('/api/enfrentamientos/enf-1/estado')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({ estado: 'invalido' });

    expect(res.status).toBe(400);
    expect(enfrentamientosService.cambiarEstado).not.toHaveBeenCalled();
  });

  it('TC-API-ENF-009: estado válido llama al servicio y devuelve 200', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    enfrentamientosService.cambiarEstado.mockResolvedValue({ id: 'enf-1', estado: 'en_curso' });

    const res = await request(app)
      .patch('/api/enfrentamientos/enf-1/estado')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({ estado: 'en_curso' });

    expect(res.status).toBe(200);
    expect(enfrentamientosService.cambiarEstado).toHaveBeenCalledWith(
      'enf-1',
      expect.objectContaining({ estado: 'en_curso' }),
      ORGANIZADOR_TEST.id,
    );
  });
});
