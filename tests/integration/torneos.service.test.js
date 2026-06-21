import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ORGANIZADOR_TEST, JUGADOR_TEST } from '../fixtures/usuarios.fixture.js';
import { COMMANDER_VALIDO, COMMANDER_99_CARTAS } from '../fixtures/mazos.fixture.js';
import {
  crearTransaccionFake,
  aMazoCartas,
  crearTorneoMock,
} from '../helpers/integration.helper.js';

// ─── Mocks de dependencias del service ───────────────────────────────────────

vi.mock('../../src/modules/torneos/torneos.repository.js', () => ({
  buscarPorId: vi.fn(),
  buscarInscripcion: vi.fn(),
  buscarInscripcionPorMazo: vi.fn(),
  crearInscripcion: vi.fn(),
  crearSnapshot: vi.fn(),
  buscarUsuarioPorId: vi.fn(),
  contarInscripcionesConfirmadas: vi.fn(),
  verificarEnfrentamientosPendientes: vi.fn(),
  obtenerJugadoresInscritos: vi.fn(),
  buscarOCrearEstadistica: vi.fn(),
  incrementarTorneosParticipados: vi.fn(),
  actualizar: vi.fn(),
  listar: vi.fn(),
  listarInscripciones: vi.fn(),
  buscarInscripcionPorId: vi.fn(),
  eliminarInscripcion: vi.fn(),
  listarInscripcionesPendientes: vi.fn(),
  aprobarInscripcion: vi.fn(),
  obtenerTablaPosiciones: vi.fn(),
  obtenerSnapshotInscripcion: vi.fn(),
  cerrarTorneo: vi.fn(),
}));

vi.mock('../../src/modules/mazos/mazos.repository.js', () => ({
  buscarPorId: vi.fn(),
}));

vi.mock('../../src/modules/notificaciones/email.service.js', () => ({
  notificarSolicitudInscripcion: vi.fn(),
  notificarInscripcionAceptada: vi.fn(),
  notificarInscripcionRechazada: vi.fn(),
}));

vi.mock('../../src/models/index.js', () => ({
  sequelize: { transaction: vi.fn() },
}));

const repo = await import('../../src/modules/torneos/torneos.repository.js');
const mazosRepo = await import('../../src/modules/mazos/mazos.repository.js');
const emailService = await import('../../src/modules/notificaciones/email.service.js');
const { sequelize } = await import('../../src/models/index.js');
const service = await import('../../src/modules/torneos/torneos.service.js');

let transaccion;

beforeEach(() => {
  vi.clearAllMocks();
  transaccion = crearTransaccionFake();
  // Cubre ambos usos: transaction(cb) y transaction()
  sequelize.transaction.mockImplementation(async (cb) =>
    typeof cb === 'function' ? cb(transaccion) : transaccion,
  );
  emailService.notificarSolicitudInscripcion.mockResolvedValue(undefined);
  repo.buscarUsuarioPorId.mockResolvedValue({ correo: null });
});

// ═══════════════════════════════════════════════════════════════════════════
// Ciclo de vida del torneo — cambiarEstado()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — cambiarEstado() @regression', () => {
  it('TC-TOR-001: organizador inicia torneo con jugadores suficientes', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ formato: 'STANDARD' }));
    repo.contarInscripcionesConfirmadas.mockResolvedValue(2);
    repo.actualizar.mockResolvedValue(crearTorneoMock({ estado: 'en_curso' }));

    const res = await service.cambiarEstado('torneo-1', ORGANIZADOR_TEST.id, {
      estado: 'en_curso',
    });

    expect(repo.actualizar).toHaveBeenCalledWith('torneo-1', { estado: 'en_curso' });
    expect(res.estado).toBe('en_curso');
  });

  it('TC-TOR-002: no se puede iniciar con menos de 2 jugadores (Standard)', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ formato: 'STANDARD' }));
    repo.contarInscripcionesConfirmadas.mockResolvedValue(1);

    await expect(
      service.cambiarEstado('torneo-1', ORGANIZADOR_TEST.id, { estado: 'en_curso' }),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/al menos 2/) });
    expect(repo.actualizar).not.toHaveBeenCalled();
  });

  it('TC-TOR-003: Commander requiere al menos 3 jugadores confirmados', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ formato: 'COMMANDER' }));
    repo.contarInscripcionesConfirmadas.mockResolvedValue(2);

    await expect(
      service.cambiarEstado('torneo-1', ORGANIZADOR_TEST.id, { estado: 'en_curso' }),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/al menos 3/) });
  });

  it('TC-TOR-004: no se puede finalizar con enfrentamientos pendientes', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ estado: 'en_curso' }));
    repo.verificarEnfrentamientosPendientes.mockResolvedValue(2);

    await expect(
      service.cambiarEstado('torneo-1', ORGANIZADOR_TEST.id, { estado: 'finalizado' }),
    ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/sin resultado/) });
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('TC-TOR-005: finalizar actualiza estadísticas dentro de una transacción', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ estado: 'en_curso' }));
    repo.verificarEnfrentamientosPendientes.mockResolvedValue(0);
    repo.obtenerJugadoresInscritos.mockResolvedValue(['jug-1', 'jug-2']);
    repo.buscarOCrearEstadistica.mockResolvedValue([{}, true]);
    repo.incrementarTorneosParticipados.mockResolvedValue([1]);
    repo.actualizar.mockResolvedValue(crearTorneoMock({ estado: 'finalizado' }));

    const res = await service.cambiarEstado('torneo-1', ORGANIZADOR_TEST.id, {
      estado: 'finalizado',
    });

    expect(sequelize.transaction).toHaveBeenCalledOnce();
    expect(repo.buscarOCrearEstadistica).toHaveBeenCalledWith('jug-1', transaccion);
    expect(repo.buscarOCrearEstadistica).toHaveBeenCalledWith('jug-2', transaccion);
    expect(repo.incrementarTorneosParticipados).toHaveBeenCalledTimes(2);
    expect(repo.actualizar).toHaveBeenCalledWith('torneo-1', { estado: 'finalizado' });
    expect(res.estado).toBe('finalizado');
  });

  it('TC-TOR-006: solo el organizador dueño puede cambiar el estado', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ organizador_id: 'otro-org' }));

    await expect(
      service.cambiarEstado('torneo-1', ORGANIZADOR_TEST.id, { estado: 'en_curso' }),
    ).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/Solo el organizador/) });
  });

  it('TC-TOR-007: un torneo finalizado no puede cambiar de estado', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ estado: 'finalizado' }));

    await expect(
      service.cambiarEstado('torneo-1', ORGANIZADOR_TEST.id, { estado: 'en_curso' }),
    ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/finalizado o cancelado/) });
  });

  it('TC-TOR-008: torneo inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(
      service.cambiarEstado('inexistente', ORGANIZADOR_TEST.id, { estado: 'en_curso' }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Inscripciones — inscribir()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — inscribir() @regression', () => {
  function mazoCommanderValido(overrides = {}) {
    return {
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      nombre: 'Mi mazo',
      MazoCartas: aMazoCartas(COMMANDER_VALIDO.cartas),
      ...overrides,
    };
  }

  it('TC-INS-001: inscripción válida crea la inscripción y el snapshot del mazo', async () => {
    const mazo = mazoCommanderValido();
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ formato: 'COMMANDER' }));
    repo.buscarInscripcion.mockResolvedValue(null);
    repo.buscarInscripcionPorMazo.mockResolvedValue(null);
    mazosRepo.buscarPorId.mockResolvedValue(mazo);
    repo.crearInscripcion.mockResolvedValue({ id: 'insc-1' });
    repo.crearSnapshot.mockResolvedValue({});

    const res = await service.inscribir('torneo-1', JUGADOR_TEST.id, 'mazo-1');

    expect(repo.crearInscripcion).toHaveBeenCalledWith(
      expect.objectContaining({
        torneo_id: 'torneo-1',
        usuario_id: JUGADOR_TEST.id,
        mazo_id: 'mazo-1',
        confirmado: false,
      }),
    );
    expect(repo.crearSnapshot).toHaveBeenCalledTimes(mazo.MazoCartas.length);
    expect(res).toEqual({ id: 'insc-1' });
  });

  it('TC-INS-002: no se puede inscribir si el torneo no está pendiente', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ estado: 'en_curso' }));

    await expect(
      service.inscribir('torneo-1', JUGADOR_TEST.id, 'mazo-1'),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/no está abierto/) });
    expect(repo.crearInscripcion).not.toHaveBeenCalled();
  });

  it('TC-INS-003: no se puede inscribir dos veces al mismo torneo', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ formato: 'COMMANDER' }));
    repo.buscarInscripcion.mockResolvedValue({ id: 'insc-existente' });

    await expect(
      service.inscribir('torneo-1', JUGADOR_TEST.id, 'mazo-1'),
    ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/Ya estás inscrito/) });
  });

  it('TC-INS-004: no se puede inscribir un mazo de otro usuario', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ formato: 'COMMANDER' }));
    repo.buscarInscripcion.mockResolvedValue(null);
    repo.buscarInscripcionPorMazo.mockResolvedValue(null);
    mazosRepo.buscarPorId.mockResolvedValue(
      mazoCommanderValido({ usuario_id: 'otro-jugador' }),
    );

    await expect(
      service.inscribir('torneo-1', JUGADOR_TEST.id, 'mazo-1'),
    ).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/no te pertenece/) });
  });

  it('TC-INS-005: mazo de formato distinto al torneo es rechazado', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ formato: 'STANDARD' }));
    repo.buscarInscripcion.mockResolvedValue(null);
    repo.buscarInscripcionPorMazo.mockResolvedValue(null);
    mazosRepo.buscarPorId.mockResolvedValue(mazoCommanderValido({ formato: 'COMMANDER' }));

    await expect(
      service.inscribir('torneo-1', JUGADOR_TEST.id, 'mazo-1'),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/formato COMMANDER/) });
  });

  it('TC-INS-006: mazo que no cumple las reglas del formato es rechazado', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ formato: 'COMMANDER' }));
    repo.buscarInscripcion.mockResolvedValue(null);
    repo.buscarInscripcionPorMazo.mockResolvedValue(null);
    mazosRepo.buscarPorId.mockResolvedValue(
      mazoCommanderValido({ MazoCartas: aMazoCartas(COMMANDER_99_CARTAS.cartas) }),
    );

    await expect(
      service.inscribir('torneo-1', JUGADOR_TEST.id, 'mazo-1'),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/no cumple los requisitos/) });
    expect(repo.crearInscripcion).not.toHaveBeenCalled();
  });

  it('TC-INS-007: el mismo mazo no puede inscribirse dos veces en el torneo', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ formato: 'COMMANDER' }));
    repo.buscarInscripcion.mockResolvedValue(null);
    repo.buscarInscripcionPorMazo.mockResolvedValue({ id: 'insc-mazo' });

    await expect(
      service.inscribir('torneo-1', JUGADOR_TEST.id, 'mazo-1'),
    ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/mazo ya está inscrito/) });
  });

  it('TC-INS-008: inscripción en torneo inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(
      service.inscribir('inexistente', JUGADOR_TEST.id, 'mazo-1'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-INS-009: el email al organizador se dispara sin bloquear la inscripción', async () => {
    repo.buscarPorId.mockResolvedValue(
      crearTorneoMock({ formato: 'COMMANDER', organizador_id: ORGANIZADOR_TEST.id }),
    );
    repo.buscarInscripcion.mockResolvedValue(null);
    repo.buscarInscripcionPorMazo.mockResolvedValue(null);
    mazosRepo.buscarPorId.mockResolvedValue(mazoCommanderValido());
    repo.crearInscripcion.mockResolvedValue({ id: 'insc-1' });
    repo.crearSnapshot.mockResolvedValue({});
    repo.buscarUsuarioPorId.mockImplementation((id) =>
      Promise.resolve(
        id === ORGANIZADOR_TEST.id
          ? { correo: 'org@test.local' }
          : { nombre_usuario: 'jugador_test' },
      ),
    );

    const res = await service.inscribir('torneo-1', JUGADOR_TEST.id, 'mazo-1');

    expect(res).toEqual({ id: 'insc-1' });
    await vi.waitFor(() =>
      expect(emailService.notificarSolicitudInscripcion).toHaveBeenCalledWith(
        expect.objectContaining({
          correoOrganizador: 'org@test.local',
          nombreTorneo: 'Torneo de prueba',
          nombreMazo: 'Mi mazo',
        }),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Consultas — listar(), misTorneos(), listarInscripciones()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — listar() @regression', () => {
  it('TC-LIS-001: delega a repo.listar con los filtros recibidos', async () => {
    const torneos = [crearTorneoMock()];
    repo.listar.mockResolvedValue(torneos);

    const filtros = { formato: 'STANDARD', estado: 'pendiente', q: 'prueba' };
    const res = await service.listar(filtros);

    expect(repo.listar).toHaveBeenCalledWith(
      expect.objectContaining({
        formato: 'STANDARD',
        estado: 'pendiente',
        q: 'prueba',
      }),
    );
    expect(res).toEqual(torneos);
  });

  it('TC-LIS-002: sin filtros delega con valores undefined', async () => {
    repo.listar.mockResolvedValue([]);

    await service.listar();

    expect(repo.listar).toHaveBeenCalledWith(
      expect.objectContaining({
        organizadorId: undefined,
        formato: undefined,
        estado: undefined,
      }),
    );
  });
});

describe('torneos.service — misTorneos() @regression', () => {
  it('TC-LIS-003: delega con organizadorId e incluirTodos', async () => {
    const torneos = [crearTorneoMock()];
    repo.listar.mockResolvedValue(torneos);

    const res = await service.misTorneos(ORGANIZADOR_TEST.id);

    expect(repo.listar).toHaveBeenCalledWith({
      organizadorId: ORGANIZADOR_TEST.id,
      incluirTodos: true,
    });
    expect(res).toEqual(torneos);
  });
});

describe('torneos.service — listarInscripciones() @regression', () => {
  it('TC-LIS-004: delega a repo.listarInscripciones', async () => {
    const inscripciones = [{ id: 'insc-1' }];
    repo.listarInscripciones.mockResolvedValue(inscripciones);

    const res = await service.listarInscripciones('torneo-1');

    expect(repo.listarInscripciones).toHaveBeenCalledWith('torneo-1');
    expect(res).toEqual(inscripciones);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Cancelar inscripción — cancelarInscripcion()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — cancelarInscripcion() @regression', () => {
  const INSCRIPCION_MOCK = {
    id: 'insc-1',
    torneo_id: 'torneo-1',
    usuario_id: JUGADOR_TEST.id,
  };

  it('TC-CAN-001: jugador cancela su propia inscripción', async () => {
    repo.buscarInscripcionPorId.mockResolvedValue(INSCRIPCION_MOCK);
    repo.eliminarInscripcion.mockResolvedValue(undefined);

    await service.cancelarInscripcion('torneo-1', 'insc-1', JUGADOR_TEST.id, 'jugador');

    expect(repo.eliminarInscripcion).toHaveBeenCalledWith('insc-1');
  });

  it('TC-CAN-002: jugador no puede cancelar inscripción ajena', async () => {
    repo.buscarInscripcionPorId.mockResolvedValue({
      ...INSCRIPCION_MOCK,
      usuario_id: 'otro-jugador',
    });

    await expect(
      service.cancelarInscripcion('torneo-1', 'insc-1', JUGADOR_TEST.id, 'jugador'),
    ).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/no te pertenece/) });
    expect(repo.eliminarInscripcion).not.toHaveBeenCalled();
  });

  it('TC-CAN-003: organizador dueño puede cancelar cualquier inscripción', async () => {
    repo.buscarInscripcionPorId.mockResolvedValue(INSCRIPCION_MOCK);
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.eliminarInscripcion.mockResolvedValue(undefined);

    await service.cancelarInscripcion('torneo-1', 'insc-1', ORGANIZADOR_TEST.id, 'organizador');

    expect(repo.eliminarInscripcion).toHaveBeenCalledWith('insc-1');
  });

  it('TC-CAN-004: organizador que no es dueño no puede cancelar', async () => {
    repo.buscarInscripcionPorId.mockResolvedValue(INSCRIPCION_MOCK);
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ organizador_id: 'otro-org' }));

    await expect(
      service.cancelarInscripcion('torneo-1', 'insc-1', ORGANIZADOR_TEST.id, 'organizador'),
    ).rejects.toMatchObject({ status: 403, message: expect.stringMatching(/No tienes permiso/) });
  });

  it('TC-CAN-005: inscripción inexistente devuelve 404', async () => {
    repo.buscarInscripcionPorId.mockResolvedValue(null);

    await expect(
      service.cancelarInscripcion('torneo-1', 'insc-x', JUGADOR_TEST.id, 'jugador'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-CAN-006: inscripción que no corresponde al torneo devuelve 400', async () => {
    repo.buscarInscripcionPorId.mockResolvedValue({
      ...INSCRIPCION_MOCK,
      torneo_id: 'otro-torneo',
    });

    await expect(
      service.cancelarInscripcion('torneo-1', 'insc-1', JUGADOR_TEST.id, 'jugador'),
    ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/no corresponde/) });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Pendientes — listarPendientes()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — listarPendientes() @regression', () => {
  it('TC-PEN-001: organizador dueño obtiene las inscripciones pendientes', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    const pendientes = [{ id: 'insc-1', confirmado: false }];
    repo.listarInscripcionesPendientes.mockResolvedValue(pendientes);

    const res = await service.listarPendientes('torneo-1', ORGANIZADOR_TEST.id);

    expect(repo.listarInscripcionesPendientes).toHaveBeenCalledWith('torneo-1');
    expect(res).toEqual(pendientes);
  });

  it('TC-PEN-002: usuario que no es el organizador recibe 403', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());

    await expect(
      service.listarPendientes('torneo-1', 'otro-usuario'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('TC-PEN-003: torneo inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(
      service.listarPendientes('inexistente', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 404 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Aprobar inscripción — aprobarInscripcion()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — aprobarInscripcion() @regression', () => {
  const INSCRIPCION_MOCK = { id: 'insc-1', torneo_id: 'torneo-1', usuario_id: JUGADOR_TEST.id };

  it('TC-APR-001: organizador aprueba inscripción válida', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.buscarInscripcionPorId.mockResolvedValue(INSCRIPCION_MOCK);
    repo.aprobarInscripcion.mockResolvedValue({ ...INSCRIPCION_MOCK, confirmado: true });
    repo.buscarUsuarioPorId.mockResolvedValue({ correo: null });

    const res = await service.aprobarInscripcion('torneo-1', 'insc-1', ORGANIZADOR_TEST.id);

    expect(repo.aprobarInscripcion).toHaveBeenCalledWith('insc-1');
    expect(res.confirmado).toBe(true);
  });

  it('TC-APR-002: usuario que no es organizador recibe 403', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());

    await expect(
      service.aprobarInscripcion('torneo-1', 'insc-1', 'otro-usuario'),
    ).rejects.toMatchObject({ status: 403 });
    expect(repo.aprobarInscripcion).not.toHaveBeenCalled();
  });

  it('TC-APR-003: inscripción inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.buscarInscripcionPorId.mockResolvedValue(null);

    await expect(
      service.aprobarInscripcion('torneo-1', 'insc-x', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-APR-004: email de aceptación se dispara sin bloquear', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.buscarInscripcionPorId.mockResolvedValue(INSCRIPCION_MOCK);
    repo.aprobarInscripcion.mockResolvedValue({ ...INSCRIPCION_MOCK, confirmado: true });
    repo.buscarUsuarioPorId.mockResolvedValue({ correo: 'jugador@test.local' });
    emailService.notificarInscripcionAceptada.mockResolvedValue(undefined);

    await service.aprobarInscripcion('torneo-1', 'insc-1', ORGANIZADOR_TEST.id);

    await vi.waitFor(() =>
      expect(emailService.notificarInscripcionAceptada).toHaveBeenCalledWith(
        expect.objectContaining({
          correoJugador: 'jugador@test.local',
          nombreTorneo: 'Torneo de prueba',
        }),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Rechazar inscripción — rechazarInscripcion()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — rechazarInscripcion() @regression', () => {
  const INSCRIPCION_MOCK = { id: 'insc-1', torneo_id: 'torneo-1', usuario_id: JUGADOR_TEST.id };

  it('TC-REC-001: organizador rechaza inscripción y la elimina', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.buscarInscripcionPorId.mockResolvedValue(INSCRIPCION_MOCK);
    repo.eliminarInscripcion.mockResolvedValue(undefined);
    repo.buscarUsuarioPorId.mockResolvedValue({ correo: null });

    await service.rechazarInscripcion('torneo-1', 'insc-1', ORGANIZADOR_TEST.id);

    expect(repo.eliminarInscripcion).toHaveBeenCalledWith('insc-1');
  });

  it('TC-REC-002: usuario que no es organizador recibe 403', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());

    await expect(
      service.rechazarInscripcion('torneo-1', 'insc-1', 'otro-usuario'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('TC-REC-003: inscripción inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.buscarInscripcionPorId.mockResolvedValue(null);

    await expect(
      service.rechazarInscripcion('torneo-1', 'insc-x', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-REC-004: email de rechazo se dispara sin bloquear', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.buscarInscripcionPorId.mockResolvedValue(INSCRIPCION_MOCK);
    repo.eliminarInscripcion.mockResolvedValue(undefined);
    repo.buscarUsuarioPorId.mockResolvedValue({ correo: 'jugador@test.local' });
    emailService.notificarInscripcionRechazada.mockResolvedValue(undefined);

    await service.rechazarInscripcion('torneo-1', 'insc-1', ORGANIZADOR_TEST.id);

    await vi.waitFor(() =>
      expect(emailService.notificarInscripcionRechazada).toHaveBeenCalledWith(
        expect.objectContaining({
          correoJugador: 'jugador@test.local',
          nombreTorneo: 'Torneo de prueba',
        }),
      ),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tabla de posiciones — obtenerTablaPosiciones()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — obtenerTablaPosiciones() @regression', () => {
  function crearInscripcionConPuntos(id, usuarioId, nombreUsuario, participantes) {
    return {
      toJSON: () => ({
        id,
        usuario_id: usuarioId,
        Jugador: { Usuario: { nombre_usuario: nombreUsuario } },
        EnfrentamientoParticipantes: participantes,
      }),
    };
  }

  it('TC-TAB-001: construye la tabla ordenada por puntos y victorias', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.obtenerTablaPosiciones.mockResolvedValue([
      crearInscripcionConPuntos('insc-1', 'jug-1', 'jugador_a', [
        { puntos_obtenidos: 3, resultado: 'ganador' },
        { puntos_obtenidos: 0, resultado: 'perdedor' },
      ]),
      crearInscripcionConPuntos('insc-2', 'jug-2', 'jugador_b', [
        { puntos_obtenidos: 3, resultado: 'ganador' },
        { puntos_obtenidos: 3, resultado: 'ganador' },
      ]),
    ]);

    const tabla = await service.obtenerTablaPosiciones('torneo-1');

    expect(tabla).toHaveLength(2);
    expect(tabla[0]).toMatchObject({
      posicion: 1,
      jugador_id: 'jug-2',
      nombre_usuario: 'jugador_b',
      puntos_totales: 6,
      victorias: 2,
    });
    expect(tabla[1]).toMatchObject({
      posicion: 2,
      jugador_id: 'jug-1',
      puntos_totales: 3,
      victorias: 1,
    });
  });

  it('TC-TAB-002: desempate por victorias cuando los puntos son iguales', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.obtenerTablaPosiciones.mockResolvedValue([
      crearInscripcionConPuntos('insc-1', 'jug-1', 'jugador_a', [
        { puntos_obtenidos: 3, resultado: 'ganador' },
      ]),
      crearInscripcionConPuntos('insc-2', 'jug-2', 'jugador_b', [
        { puntos_obtenidos: 1, resultado: 'empate' },
        { puntos_obtenidos: 2, resultado: 'perdedor' },
      ]),
    ]);

    const tabla = await service.obtenerTablaPosiciones('torneo-1');

    expect(tabla[0].jugador_id).toBe('jug-1');
    expect(tabla[0].victorias).toBe(1);
    expect(tabla[1].jugador_id).toBe('jug-2');
    expect(tabla[1].victorias).toBe(0);
  });

  it('TC-TAB-003: torneo inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(
      service.obtenerTablaPosiciones('inexistente'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-TAB-004: tabla vacía cuando no hay inscripciones', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.obtenerTablaPosiciones.mockResolvedValue([]);

    const tabla = await service.obtenerTablaPosiciones('torneo-1');

    expect(tabla).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Snapshot — obtenerSnapshotInscripcion()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — obtenerSnapshotInscripcion() @regression', () => {
  const INSCRIPCION_MOCK = { id: 'insc-1', torneo_id: 'torneo-1', usuario_id: JUGADOR_TEST.id };

  it('TC-SNP-001: organizador obtiene snapshot válido', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.buscarInscripcionPorId.mockResolvedValue(INSCRIPCION_MOCK);
    const snapshotData = [{ carta_id: 'carta-1', cantidad: 1 }];
    repo.obtenerSnapshotInscripcion.mockResolvedValue(snapshotData);

    const res = await service.obtenerSnapshotInscripcion('torneo-1', 'insc-1', ORGANIZADOR_TEST.id);

    expect(repo.obtenerSnapshotInscripcion).toHaveBeenCalledWith('insc-1');
    expect(res).toEqual(snapshotData);
  });

  it('TC-SNP-002: usuario que no es organizador recibe 403', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());

    await expect(
      service.obtenerSnapshotInscripcion('torneo-1', 'insc-1', 'otro-usuario'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('TC-SNP-003: torneo inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(
      service.obtenerSnapshotInscripcion('inexistente', 'insc-1', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-SNP-004: inscripción inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock());
    repo.buscarInscripcionPorId.mockResolvedValue(null);

    await expect(
      service.obtenerSnapshotInscripcion('torneo-1', 'insc-x', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 404 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Cerrar torneo — cerrarTorneo()
// ═══════════════════════════════════════════════════════════════════════════

describe('torneos.service — cerrarTorneo() @regression', () => {
  it('TC-CER-001: cierra torneo con transacción e incrementa estadísticas', async () => {
    repo.buscarPorId
      .mockResolvedValueOnce(crearTorneoMock({ estado: 'en_curso' }))
      .mockResolvedValueOnce(crearTorneoMock({ estado: 'finalizado' }));
    repo.verificarEnfrentamientosPendientes.mockResolvedValue(0);
    repo.obtenerJugadoresInscritos.mockResolvedValue(['jug-1', 'jug-2']);
    repo.incrementarTorneosParticipados.mockResolvedValue([1]);
    repo.cerrarTorneo.mockResolvedValue(undefined);

    const res = await service.cerrarTorneo('torneo-1', ORGANIZADOR_TEST.id);

    expect(sequelize.transaction).toHaveBeenCalledOnce();
    expect(repo.incrementarTorneosParticipados).toHaveBeenCalledTimes(2);
    expect(repo.incrementarTorneosParticipados).toHaveBeenCalledWith('jug-1', transaccion);
    expect(repo.incrementarTorneosParticipados).toHaveBeenCalledWith('jug-2', transaccion);
    expect(repo.cerrarTorneo).toHaveBeenCalledWith('torneo-1', transaccion);
    expect(res.estado).toBe('finalizado');
  });

  it('TC-CER-002: torneo inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(
      service.cerrarTorneo('inexistente', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('TC-CER-003: usuario que no es organizador recibe 403', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ estado: 'en_curso' }));

    await expect(
      service.cerrarTorneo('torneo-1', 'otro-usuario'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('TC-CER-004: torneo ya finalizado devuelve 409', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ estado: 'finalizado' }));

    await expect(
      service.cerrarTorneo('torneo-1', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/ya está cerrado/) });
  });

  it('TC-CER-005: no se puede cerrar con enfrentamientos pendientes', async () => {
    repo.buscarPorId.mockResolvedValue(crearTorneoMock({ estado: 'en_curso' }));
    repo.verificarEnfrentamientosPendientes.mockResolvedValue(3);

    await expect(
      service.cerrarTorneo('torneo-1', ORGANIZADOR_TEST.id),
    ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/sin resultado/) });
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });
});
