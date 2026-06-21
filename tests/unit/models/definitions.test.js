import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/config/db.js', () => ({
  default: {
    define: vi.fn(() => ({})),
  },
}));

const sequelize = (await import('../../../src/config/db.js')).default;

describe('modelos — definiciones individuales', () => {
  const modelos = [
    'Carta', 'Enfrentamiento', 'EnfrentamientoParticipante', 'Estadistica',
    'Inscripcion', 'Jugador', 'Mazo', 'MazoCarta', 'Organizador',
    'Ronda', 'SnapshotMazoInscripcion', 'Tienda', 'Torneo', 'Usuario',
  ];

  for (const nombre of modelos) {
    it(`${nombre}.js ejecuta sequelize.define`, async () => {
      await import(`../../../src/models/${nombre}.js`);
      const calls = sequelize.define.mock.calls;
      const found = calls.some(([name]) => name === nombre);
      expect(found).toBe(true);
    });
  }
});
