import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn().mockResolvedValue({ id: 'mock-email-id' });

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      constructor() {
        this.emails = { send: sendMock };
      }
    },
  };
});

const {
  notificarSolicitudInscripcion,
  notificarInscripcionAceptada,
  notificarInscripcionRechazada,
} = await import('../../../src/modules/notificaciones/email.service.js');

describe('email.service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-EM-001: notificarSolicitudInscripcion envía email al organizador', async () => {
    await notificarSolicitudInscripcion({
      correoOrganizador: 'org@test.com',
      nombreJugador: 'Juan',
      nombreTorneo: 'Torneo Alpha',
      nombreMazo: 'Mi Mazo',
    });

    expect(sendMock).toHaveBeenCalledOnce();
    const args = sendMock.mock.calls[0][0];
    expect(args.to).toBe('org@test.com');
    expect(args.subject).toContain('Torneo Alpha');
    expect(args.html).toContain('Juan');
    expect(args.html).toContain('Mi Mazo');
  });

  it('TC-EM-002: notificarInscripcionAceptada envía email al jugador', async () => {
    await notificarInscripcionAceptada({
      correoJugador: 'jugador@test.com',
      nombreTorneo: 'Commander Cup',
    });

    expect(sendMock).toHaveBeenCalledOnce();
    const args = sendMock.mock.calls[0][0];
    expect(args.to).toBe('jugador@test.com');
    expect(args.subject).toContain('aceptada');
    expect(args.subject).toContain('Commander Cup');
  });

  it('TC-EM-003: notificarInscripcionRechazada envía email al jugador', async () => {
    await notificarInscripcionRechazada({
      correoJugador: 'jugador@test.com',
      nombreTorneo: 'Liga Standard',
    });

    expect(sendMock).toHaveBeenCalledOnce();
    const args = sendMock.mock.calls[0][0];
    expect(args.to).toBe('jugador@test.com');
    expect(args.subject).toContain('rechazada');
    expect(args.subject).toContain('Liga Standard');
  });

  it('TC-EM-004: usa from con el valor configurado', async () => {
    await notificarInscripcionAceptada({
      correoJugador: 'test@test.com',
      nombreTorneo: 'Test',
    });

    const args = sendMock.mock.calls[0][0];
    expect(args.from).toBeDefined();
    expect(typeof args.from).toBe('string');
  });
});
