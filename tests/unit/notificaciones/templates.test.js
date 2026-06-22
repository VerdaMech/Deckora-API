import { describe, it, expect } from 'vitest';
import { inscripcionAceptada } from '../../../src/modules/notificaciones/templates/inscripcionAceptada.js';
import { inscripcionRechazada } from '../../../src/modules/notificaciones/templates/inscripcionRechazada.js';
import { solicitudInscripcion } from '../../../src/modules/notificaciones/templates/solicitudInscripcion.js';

describe('email templates', () => {
  describe('inscripcionAceptada', () => {
    const result = inscripcionAceptada({ nombreTorneo: 'Commander Showdown' });

    it('TC-TPL-001: subject incluye nombre del torneo', () => {
      expect(result.subject).toContain('Commander Showdown');
      expect(result.subject).toContain('aceptada');
    });

    it('TC-TPL-002: html contiene nombre del torneo y aprobada', () => {
      expect(result.html).toContain('Commander Showdown');
      expect(result.html).toContain('aprobada');
    });
  });

  describe('inscripcionRechazada', () => {
    const result = inscripcionRechazada({ nombreTorneo: 'Torneo Standard' });

    it('TC-TPL-003: subject incluye nombre del torneo y rechazada', () => {
      expect(result.subject).toContain('Torneo Standard');
      expect(result.subject).toContain('rechazada');
    });

    it('TC-TPL-004: html contiene nombre del torneo y rechazada', () => {
      expect(result.html).toContain('Torneo Standard');
      expect(result.html).toContain('rechazada');
    });
  });

  describe('solicitudInscripcion', () => {
    const result = solicitudInscripcion({
      nombreJugador: 'Juan',
      nombreTorneo: 'Liga Modern',
      nombreMazo: 'Burn Aggro',
    });

    it('TC-TPL-005: subject incluye nombre del torneo', () => {
      expect(result.subject).toContain('Liga Modern');
    });

    it('TC-TPL-006: html contiene jugador, torneo y mazo', () => {
      expect(result.html).toContain('Juan');
      expect(result.html).toContain('Liga Modern');
      expect(result.html).toContain('Burn Aggro');
    });
  });
});
