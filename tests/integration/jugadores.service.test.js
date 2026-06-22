import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JUGADOR_TEST } from '../fixtures/usuarios.fixture.js';

// ─── Mocks de dependencias del service ───────────────────────────────────────
// jugadores.service.js importa modelos directamente (Torneo, Inscripcion, Mazo),
// no un repositorio. Mockeamos el barrel de modelos.

vi.mock('../../src/models/index.js', () => ({
  Torneo: { findAll: vi.fn() },
  Inscripcion: { findAll: vi.fn() },
  Mazo: {},
}));

const { Torneo, Inscripcion } = await import('../../src/models/index.js');
const service = await import('../../src/modules/jugadores/jugadores.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('jugadores.service — misTorneos', () => {
  it('TC-JUG-001: devuelve torneos del jugador sin limite', async () => {
    const torneos = [
      { id: 't1', nombre: 'Torneo Alpha', fecha: '2025-01-01' },
      { id: 't2', nombre: 'Torneo Beta', fecha: '2025-02-01' },
    ];
    Torneo.findAll.mockResolvedValue(torneos);

    const res = await service.misTorneos(JUGADOR_TEST.id);

    expect(res).toEqual(torneos);
    expect(Torneo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['fecha', 'ASC']],
      }),
    );
    // Sin limit, la opcion no debe tener la propiedad limit
    const callArg = Torneo.findAll.mock.calls[0][0];
    expect(callArg).not.toHaveProperty('limit');
  });

  it('TC-JUG-002: devuelve torneos del jugador con limite', async () => {
    const torneos = [{ id: 't1', nombre: 'Torneo Alpha', fecha: '2025-01-01' }];
    Torneo.findAll.mockResolvedValue(torneos);

    const res = await service.misTorneos(JUGADOR_TEST.id, '3');

    expect(res).toEqual(torneos);
    const callArg = Torneo.findAll.mock.calls[0][0];
    expect(callArg.limit).toBe(3);
  });
});

describe('jugadores.service — misInscripciones', () => {
  it('TC-JUG-003: mapea inscripciones correctamente con torneo y mazo', async () => {
    Inscripcion.findAll.mockResolvedValue([
      {
        toJSON: () => ({
          id: 'ins-1',
          fecha_inscripcion: '2025-03-15',
          confirmado: true,
          Torneo: { id: 't1', nombre: 'Torneo Alpha' },
          Mazo: { id: 'm1', nombre: 'Dragon Deck', formato: 'COMMANDER', slug: 'dragon-deck-123' },
        }),
      },
      {
        toJSON: () => ({
          id: 'ins-2',
          fecha_inscripcion: '2025-04-01',
          confirmado: false,
          Torneo: { id: 't2', nombre: 'Torneo Beta' },
          Mazo: null,
        }),
      },
    ]);

    const res = await service.misInscripciones(JUGADOR_TEST.id);

    expect(res).toHaveLength(2);
    expect(res[0]).toEqual({
      inscripcion: {
        id: 'ins-1',
        fecha_inscripcion: '2025-03-15',
        confirmado: true,
        mazo: { id: 'm1', nombre: 'Dragon Deck', formato: 'COMMANDER', slug: 'dragon-deck-123' },
      },
      torneo: { id: 't1', nombre: 'Torneo Alpha' },
    });
    expect(res[1]).toEqual({
      inscripcion: {
        id: 'ins-2',
        fecha_inscripcion: '2025-04-01',
        confirmado: false,
        mazo: null,
      },
      torneo: { id: 't2', nombre: 'Torneo Beta' },
    });
  });
});
