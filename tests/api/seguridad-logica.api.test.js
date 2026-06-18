import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { JUGADOR_TEST, ORGANIZADOR_TEST } from '../fixtures/usuarios.fixture.js';
import {
  TOKEN_JUGADOR,
  TOKEN_ORGANIZADOR,
  configurarAuthMock,
  crearErrorConStatus,
} from '../helpers/api.helper.js';

// ═══════════════════════════════════════════════════════════════════════════
// OWASP A06:2025 — Diseño inseguro (lógica de negocio abusable)
//
// Estos tests verifican las reglas de autorización a nivel HTTP (defensa en
// profundidad en el borde de la API): que los middlewares `auth` + `requirePerfil`
// y la propagación de errores del servicio entreguen al cliente el código de
// denegación correcto (403 / 409 / 400).
//
// La lógica de negocio de fondo (verificación de propietario, ciclo de vida del
// torneo, etc.) ya está cubierta a nivel de servicio en la Fase 3. Para no
// duplicarla, cada caso indica el test de integración equivalente. Aquí se
// distinguen:
//   • Gates REALES de middleware → se ejercen sin mockear el servicio (denegación
//     real de `requirePerfil` / controlador).
//   • Contrato HTTP de propagación → el servicio se mockea para rechazar y se
//     confirma que el status llega al cliente.
//
// UUID de un recurso "ajeno" usado en varios casos:
const UUID_AJENO = '11111111-1111-4111-8111-111111111111';

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

vi.mock('../../src/modules/enfrentamientos/enfrentamientos.service.js', () => ({
  obtenerEnfrentamiento: vi.fn(),
  registrarResultado: vi.fn(),
  cambiarEstado: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const mazosService = await import('../../src/modules/mazos/mazos.service.js');
const torneosService = await import('../../src/modules/torneos/torneos.service.js');
const enfrentamientosService = await import(
  '../../src/modules/enfrentamientos/enfrentamientos.service.js'
);
const { default: app } = await import('../../src/app.js');

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// Manipulación de recursos ajenos
// ═══════════════════════════════════════════════════════════════════════════

describe('A06 — Manipulación de recursos ajenos', () => {
  it('TC-SEC-A06-001: jugador no puede ver el mazo de otro jugador (403)', async () => {
    // Lógica de propietario cubierta por TC-MZ-003 (integración). Aquí se verifica
    // que el 403 del servicio llega al cliente a través del stack HTTP.
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.obtenerPorId.mockRejectedValue(
      crearErrorConStatus('No tienes permiso para acceder a este mazo', 403),
    );

    const res = await request(app)
      .get(`/api/mazos/${UUID_AJENO}`)
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(403);
  });

  it('TC-SEC-A06-002: jugador no puede eliminar el mazo de otro jugador (403)', async () => {
    // Lógica cubierta por TC-MZ-008 (integración). Contrato HTTP del 403.
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    mazosService.eliminar.mockRejectedValue(
      crearErrorConStatus('No tienes permiso para acceder a este mazo', 403),
    );

    const res = await request(app)
      .delete(`/api/mazos/${UUID_AJENO}`)
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(403);
    expect(mazosService.eliminar).toHaveBeenCalledWith(UUID_AJENO, JUGADOR_TEST.id);
  });

  it('TC-SEC-A06-003: jugador no puede inscribir un mazo que no le pertenece (403)', async () => {
    // Lógica cubierta por TC-INS-004 (integración). El jugador pasa el gate de rol
    // (`requirePerfil('jugador')`) pero el servicio rechaza el mazo ajeno.
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    torneosService.inscribir.mockRejectedValue(
      crearErrorConStatus('No puedes inscribir un mazo que no te pertenece', 403),
    );

    const res = await request(app)
      .post('/api/torneos/torneo-1/inscripciones')
      .set('Authorization', TOKEN_JUGADOR)
      .send({ mazo_id: UUID_AJENO });

    expect(res.status).toBe(403);
    expect(torneosService.inscribir).toHaveBeenCalledWith('torneo-1', JUGADOR_TEST.id, UUID_AJENO);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Escalación de privilegios (gates de rol)
// ═══════════════════════════════════════════════════════════════════════════

describe('A06 — Escalación de privilegios', () => {
  // NOTA: «jugador intenta crear un torneo → 403» ya está cubierto de forma
  // idéntica a nivel HTTP por TC-API-003 (tests/api/torneos.api.test.js); no se
  // duplica aquí.

  it('TC-SEC-A06-004: un no-jugador (organizador) no puede ver mazos — gate real de requirePerfil (403)', async () => {
    // Gate REAL: `requirePerfil('jugador')` deniega antes de tocar el servicio.
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .get(`/api/mazos/${UUID_AJENO}`)
      .set('Authorization', TOKEN_ORGANIZADOR);

    expect(res.status).toBe(403);
    expect(mazosService.obtenerPorId).not.toHaveBeenCalled();
  });

  it('TC-SEC-A06-005: un no-jugador (organizador) no puede inscribirse en un torneo — gate real de requirePerfil (403)', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);

    const res = await request(app)
      .post('/api/torneos/torneo-1/inscripciones')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({ mazo_id: UUID_AJENO });

    expect(res.status).toBe(403);
    expect(torneosService.inscribir).not.toHaveBeenCalled();
  });

  it('TC-SEC-A06-006: jugador no puede aprobar una inscripción ajena (403)', async () => {
    // Sin cobertura previa: el endpoint de aprobación solo valida `auth`; el
    // servicio exige ser el organizador dueño. Se confirma el 403 vía HTTP.
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    torneosService.aprobarInscripcion.mockRejectedValue(
      crearErrorConStatus('No tienes permiso para aprobar inscripciones', 403),
    );

    const res = await request(app)
      .patch(`/api/torneos/torneo-1/inscripciones/${UUID_AJENO}/aprobar`)
      .set('Authorization', TOKEN_JUGADOR);

    expect(res.status).toBe(403);
  });

  it('TC-SEC-A06-007: jugador no puede cambiar el estado de un torneo (403)', async () => {
    // Lógica cubierta por TC-TOR-006 (integración, dueño distinto). Contrato HTTP.
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    torneosService.cambiarEstado.mockRejectedValue(
      crearErrorConStatus('Solo el organizador puede cambiar el estado de este torneo', 403),
    );

    const res = await request(app)
      .patch('/api/torneos/torneo-1/estado')
      .set('Authorization', TOKEN_JUGADOR)
      .send({ estado: 'en_curso' });

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Abuso de flujo (estados / duplicados / pertenencia)
// ═══════════════════════════════════════════════════════════════════════════

describe('A06 — Abuso de flujo', () => {
  it('TC-SEC-A06-008: inscribirse en un torneo que ya está en curso devuelve 400', async () => {
    // Lógica cubierta por TC-INS-002 (integración). Contrato HTTP.
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    torneosService.inscribir.mockRejectedValue(
      crearErrorConStatus('El torneo no está abierto para inscripciones', 400),
    );

    const res = await request(app)
      .post('/api/torneos/torneo-1/inscripciones')
      .set('Authorization', TOKEN_JUGADOR)
      .send({ mazo_id: UUID_AJENO });

    expect(res.status).toBe(400);
  });

  it('TC-SEC-A06-009: inscribirse dos veces al mismo torneo devuelve 409', async () => {
    // Lógica cubierta por TC-INS-003 (integración). Contrato HTTP.
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    torneosService.inscribir.mockRejectedValue(
      crearErrorConStatus('Ya estás inscrito en este torneo', 409),
    );

    const res = await request(app)
      .post('/api/torneos/torneo-1/inscripciones')
      .set('Authorization', TOKEN_JUGADOR)
      .send({ mazo_id: UUID_AJENO });

    expect(res.status).toBe(409);
  });

  it('TC-SEC-A06-010: registrar resultado en un enfrentamiento ajeno devuelve 403', async () => {
    // Lógica cubierta por TC-ENF-006 (integración). Contrato HTTP.
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    enfrentamientosService.registrarResultado.mockRejectedValue(
      crearErrorConStatus('No tienes permiso para registrar resultados en este torneo', 403),
    );

    const res = await request(app)
      .patch(`/api/enfrentamientos/${UUID_AJENO}/resultado`)
      .set('Authorization', TOKEN_JUGADOR)
      .send({
        resultados: [
          { inscripcion_id: '22222222-2222-4222-8222-222222222222', resultado: 'ganador' },
          { inscripcion_id: '33333333-3333-4333-8333-333333333333', resultado: 'derrota' },
        ],
      });

    expect(res.status).toBe(403);
  });
});
