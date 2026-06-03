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

describe('torneos.service — cambiarEstado()', () => {
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

describe('torneos.service — inscribir()', () => {
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
