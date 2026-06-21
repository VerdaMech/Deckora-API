import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JUGADOR_TEST } from '../fixtures/usuarios.fixture.js';
import { COMMANDER_VALIDO, COMMANDER_99_CARTAS } from '../fixtures/mazos.fixture.js';
import { aMazoCartas } from '../helpers/integration.helper.js';

// ─── Mocks de dependencias del service ───────────────────────────────────────
// Se usa la estrategia de validación REAL (no se mockea estrategias/index.js),
// de modo que validar() ejerce la integración service + estrategia.

vi.mock('../../src/modules/mazos/mazos.repository.js', () => ({
  listarPorJugador: vi.fn(),
  crear: vi.fn(),
  buscarPorId: vi.fn(),
  agregarCarta: vi.fn(),
  actualizarCarta: vi.fn(),
  eliminarCarta: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  buscarRecomendaciones: vi.fn(),
}));

vi.mock('../../src/modules/cartas/cartas.repository.js', () => ({
  buscarPorScryfallId: vi.fn(),
  buscarPorId: vi.fn(),
  buscarPorNombre: vi.fn(),
  buscarPorNombreExacto: vi.fn(),
  buscarPorSetYNumero: vi.fn(),
}));

vi.mock('../../src/utils/openrouter.js', () => ({
  generateExplanation: vi.fn(),
  generarListaMazo: vi.fn(),
}));

const repo = await import('../../src/modules/mazos/mazos.repository.js');
const cartasRepo = await import('../../src/modules/cartas/cartas.repository.js');
const service = await import('../../src/modules/mazos/mazos.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mazos.service — verificación de propietario', () => {
  it('TC-MZ-001: obtenerPorId devuelve el mazo si pertenece al jugador', async () => {
    const mazo = { id: 'mazo-1', usuario_id: JUGADOR_TEST.id, formato: 'COMMANDER' };
    repo.buscarPorId.mockResolvedValue(mazo);

    const res = await service.obtenerPorId('mazo-1', JUGADOR_TEST.id);

    expect(res).toBe(mazo);
  });

  it('TC-MZ-002: obtenerPorId con mazo inexistente devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(service.obtenerPorId('mazo-x', JUGADOR_TEST.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('TC-MZ-003: obtenerPorId con mazo de otro usuario devuelve 403', async () => {
    repo.buscarPorId.mockResolvedValue({ id: 'mazo-1', usuario_id: 'otro-jugador' });

    await expect(service.obtenerPorId('mazo-1', JUGADOR_TEST.id)).rejects.toMatchObject({
      status: 403,
    });
  });

  it('TC-MZ-008: eliminar un mazo ajeno devuelve 403 y no borra nada', async () => {
    repo.buscarPorId.mockResolvedValue({ id: 'mazo-1', usuario_id: 'otro-jugador' });

    await expect(service.eliminar('mazo-1', JUGADOR_TEST.id)).rejects.toMatchObject({
      status: 403,
    });
    expect(repo.eliminar).not.toHaveBeenCalled();
  });
});

describe('mazos.service — creación y edición', () => {
  it('TC-MZ-004: crear genera un slug a partir del nombre y delega en el repositorio', async () => {
    repo.crear.mockResolvedValue({ id: 'mazo-1' });

    await service.crear(JUGADOR_TEST.id, { nombre: 'Mi Mazo Genial', formato: 'COMMANDER' });

    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Mi Mazo Genial',
        formato: 'COMMANDER',
        usuario_id: JUGADOR_TEST.id,
        slug: expect.stringMatching(/^mi-mazo-genial-\d+$/),
      }),
    );
  });

  it('TC-MZ-005: agregarCarta resuelve la carta por scryfall_id y delega', async () => {
    repo.buscarPorId.mockResolvedValue({ id: 'mazo-1', usuario_id: JUGADOR_TEST.id });
    cartasRepo.buscarPorScryfallId.mockResolvedValue({ id: 'carta-1' });
    repo.agregarCarta.mockResolvedValue({});

    await service.agregarCarta('mazo-1', JUGADOR_TEST.id, {
      scryfall_id: 'sf-1',
      cantidad: 2,
      es_comandante: false,
    });

    expect(repo.agregarCarta).toHaveBeenCalledWith('mazo-1', 'carta-1', 2, false);
  });

  it('TC-MZ-006: agregarCarta con carta inexistente en la biblioteca devuelve 404', async () => {
    repo.buscarPorId.mockResolvedValue({ id: 'mazo-1', usuario_id: JUGADOR_TEST.id });
    cartasRepo.buscarPorScryfallId.mockResolvedValue(null);
    cartasRepo.buscarPorId.mockResolvedValue(null);

    await expect(
      service.agregarCarta('mazo-1', JUGADOR_TEST.id, {
        scryfall_id: 'sf-x',
        cantidad: 1,
        es_comandante: false,
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(repo.agregarCarta).not.toHaveBeenCalled();
  });

  it('TC-MZ-007: eliminar verifica propietario y delega en el repositorio', async () => {
    repo.buscarPorId.mockResolvedValue({ id: 'mazo-1', usuario_id: JUGADOR_TEST.id });
    repo.eliminar.mockResolvedValue(1);

    await service.eliminar('mazo-1', JUGADOR_TEST.id);

    expect(repo.eliminar).toHaveBeenCalledWith('mazo-1');
  });

  it('TC-MZ-011: actualizar regenera el slug cuando cambia el nombre', async () => {
    repo.buscarPorId.mockResolvedValue({ id: 'mazo-1', usuario_id: JUGADOR_TEST.id });
    repo.actualizar.mockResolvedValue({});

    await service.actualizar('mazo-1', JUGADOR_TEST.id, { nombre: 'Nuevo Nombre' });

    expect(repo.actualizar).toHaveBeenCalledWith(
      'mazo-1',
      expect.objectContaining({
        nombre: 'Nuevo Nombre',
        slug: expect.stringMatching(/^nuevo-nombre-\d+$/),
      }),
    );
  });
});

describe('mazos.service — validar() (integra la estrategia real)', () => {
  it('TC-MZ-009: un mazo Commander válido pasa la validación', async () => {
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      MazoCartas: aMazoCartas(COMMANDER_VALIDO.cartas),
    });

    const res = await service.validar('mazo-1', JUGADOR_TEST.id);

    expect(res).toEqual({ valido: true, errores: [] });
  });

  it('TC-MZ-010: validar un formato desconocido devuelve 400', async () => {
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'PAUPER',
      MazoCartas: [],
    });

    await expect(service.validar('mazo-1', JUGADOR_TEST.id)).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/Formato desconocido/),
    });
  });
});

// ─── importarLista ─────────────────────────────────────────────────────────────

describe('mazos.service — importarLista()', () => {
  const MAZO_COMMANDER = {
    id: 'mazo-1',
    usuario_id: JUGADOR_TEST.id,
    formato: 'COMMANDER',
  };

  it('TC-MZ-012: importa líneas con formato simple "4 Lightning Bolt"', async () => {
    repo.buscarPorId.mockResolvedValue(MAZO_COMMANDER);
    cartasRepo.buscarPorNombreExacto.mockResolvedValue({ id: 'carta-bolt', nombre: 'Lightning Bolt' });
    repo.agregarCarta.mockResolvedValue({});

    const lista = '4 Lightning Bolt';
    const res = await service.importarLista('mazo-1', JUGADOR_TEST.id, lista, null);

    expect(res.importadas).toHaveLength(1);
    expect(res.importadas[0]).toMatchObject({ nombre: 'Lightning Bolt', cantidad: 4 });
    expect(res.fallidas).toHaveLength(0);
    expect(repo.agregarCarta).toHaveBeenCalledWith('mazo-1', 'carta-bolt', 4, false);
  });

  it('TC-MZ-013: importa líneas con set y número "1 Sol Ring (CMD) 217" vía buscarPorSetYNumero', async () => {
    repo.buscarPorId.mockResolvedValue(MAZO_COMMANDER);
    cartasRepo.buscarPorSetYNumero.mockResolvedValue({ id: 'carta-sol', nombre: 'Sol Ring' });
    repo.agregarCarta.mockResolvedValue({});

    const lista = '1 Sol Ring (CMD) 217';
    const res = await service.importarLista('mazo-1', JUGADOR_TEST.id, lista, null);

    expect(res.importadas).toHaveLength(1);
    expect(res.importadas[0]).toMatchObject({ nombre: 'Sol Ring', cantidad: 1 });
    expect(cartasRepo.buscarPorSetYNumero).toHaveBeenCalledWith('CMD', '217');
  });

  it('TC-MZ-014: líneas vacías y formato no reconocido se registran como fallidas', async () => {
    repo.buscarPorId.mockResolvedValue(MAZO_COMMANDER);

    const lista = '\n\n4x Lightning Bolt\n   \n';
    const res = await service.importarLista('mazo-1', JUGADOR_TEST.id, lista, null);

    // "4x Lightning Bolt" no matchea el regex (4x no es \d+\s+)
    expect(res.importadas).toHaveLength(0);
    expect(res.fallidas).toHaveLength(1);
    expect(res.fallidas[0]).toMatchObject({ error: 'Formato no reconocido' });
  });

  it('TC-MZ-015: carta no encontrada en la biblioteca se registra como fallida', async () => {
    repo.buscarPorId.mockResolvedValue(MAZO_COMMANDER);
    cartasRepo.buscarPorNombreExacto.mockResolvedValue(null);
    cartasRepo.buscarPorNombre.mockResolvedValue([]);

    const lista = '1 Carta Inventada';
    const res = await service.importarLista('mazo-1', JUGADOR_TEST.id, lista, null);

    expect(res.importadas).toHaveLength(0);
    expect(res.fallidas).toHaveLength(1);
    expect(res.fallidas[0].error).toMatch(/no encontrada en la biblioteca/);
  });

  it('TC-MZ-016: SequelizeUniqueConstraintError se maneja como carta duplicada', async () => {
    repo.buscarPorId.mockResolvedValue(MAZO_COMMANDER);
    cartasRepo.buscarPorNombreExacto.mockResolvedValue({ id: 'carta-sol', nombre: 'Sol Ring' });
    const uniqueErr = new Error('duplicate');
    uniqueErr.name = 'SequelizeUniqueConstraintError';
    repo.agregarCarta.mockRejectedValue(uniqueErr);

    const lista = '1 Sol Ring';
    const res = await service.importarLista('mazo-1', JUGADOR_TEST.id, lista, null);

    expect(res.importadas).toHaveLength(0);
    expect(res.fallidas).toHaveLength(1);
    expect(res.fallidas[0].error).toMatch(/ya está en el mazo/);
  });

  it('TC-MZ-017: marca es_comandante=true cuando el nombre coincide con el comandante', async () => {
    repo.buscarPorId.mockResolvedValue(MAZO_COMMANDER);
    cartasRepo.buscarPorNombreExacto.mockResolvedValue({ id: 'carta-atraxa', nombre: 'Atraxa, Praetors Voice' });
    repo.agregarCarta.mockResolvedValue({});
    repo.actualizar.mockResolvedValue({});

    const lista = '1 Atraxa, Praetors Voice';
    const res = await service.importarLista('mazo-1', JUGADOR_TEST.id, lista, 'Atraxa, Praetors Voice');

    expect(repo.agregarCarta).toHaveBeenCalledWith('mazo-1', 'carta-atraxa', 1, true);
    expect(res.importadas[0]).toMatchObject({ nombre: 'Atraxa, Praetors Voice', cantidad: 1 });
  });

  it('TC-MZ-018: fallback a buscarPorNombre cuando buscarPorSetYNumero y buscarPorNombreExacto fallan', async () => {
    repo.buscarPorId.mockResolvedValue(MAZO_COMMANDER);
    cartasRepo.buscarPorSetYNumero.mockResolvedValue(null);
    cartasRepo.buscarPorNombreExacto.mockResolvedValue(null);
    cartasRepo.buscarPorNombre.mockResolvedValue([{ id: 'carta-fuzzy', nombre: 'Sol Ring' }]);
    repo.agregarCarta.mockResolvedValue({});

    const lista = '1 Sol Ring (XYZ) 999';
    const res = await service.importarLista('mazo-1', JUGADOR_TEST.id, lista, null);

    expect(res.importadas).toHaveLength(1);
    expect(cartasRepo.buscarPorNombre).toHaveBeenCalledWith('Sol Ring', 1, 'COMMANDER');
  });
});

// ─── validar (casos adicionales) ───────────────────────────────────────────────

describe('mazos.service — validar() (casos adicionales)', () => {
  it('TC-MZ-019: validar un mazo Commander inválido (menos de 100 cartas) devuelve errores', async () => {
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      MazoCartas: aMazoCartas(COMMANDER_99_CARTAS.cartas),
    });

    const res = await service.validar('mazo-1', JUGADOR_TEST.id);

    expect(res.valido).toBe(false);
    expect(res.errores.length).toBeGreaterThan(0);
    expect(res.errores.some((e) => e.includes('100'))).toBe(true);
  });

  it('TC-MZ-020: validar verifica propietario antes de validar', async () => {
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: 'otro-jugador',
      formato: 'COMMANDER',
      MazoCartas: [],
    });

    await expect(service.validar('mazo-1', JUGADOR_TEST.id)).rejects.toMatchObject({
      status: 403,
    });
  });
});

// ─── recomendarCartas ──────────────────────────────────────────────────────────

const openrouter = await import('../../src/utils/openrouter.js');

describe('mazos.service — recomendarCartas()', () => {
  it('TC-MZ-021: retorna recomendaciones y explicación cuando hay embeddings', async () => {
    const embedding = JSON.stringify([0.1, 0.2, 0.3]);
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      nombre: 'Mi Mazo',
      MazoCartas: [
        { carta_id: 'c1', Carta: { nombre: 'Sol Ring', embedding } },
        { carta_id: 'c2', Carta: { nombre: 'Forest', embedding } },
      ],
    });
    const recsData = [{ nombre: 'Mana Crypt' }, { nombre: 'Arcane Signet' }];
    repo.buscarRecomendaciones.mockResolvedValue(recsData);
    openrouter.generateExplanation.mockResolvedValue('Estas cartas mejoran la rampa de maná.');

    const res = await service.recomendarCartas('mazo-1', JUGADOR_TEST.id);

    expect(res.recomendaciones).toEqual(recsData);
    expect(res.explicacion).toBe('Estas cartas mejoran la rampa de maná.');
    expect(repo.buscarRecomendaciones).toHaveBeenCalledWith(
      [0.1, 0.2, 0.3], // vector promedio de dos embeddings iguales
      ['c1', 'c2'],
      'COMMANDER',
    );
  });

  it('TC-MZ-022: lanza 422 si ninguna carta tiene embedding', async () => {
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      nombre: 'Mi Mazo',
      MazoCartas: [
        { carta_id: 'c1', Carta: { nombre: 'Sol Ring', embedding: null } },
      ],
    });

    await expect(service.recomendarCartas('mazo-1', JUGADOR_TEST.id)).rejects.toMatchObject({
      status: 422,
    });
  });

  it('TC-MZ-023: explicación es null si no hay recomendaciones', async () => {
    const embedding = JSON.stringify([1.0, 2.0]);
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      nombre: 'Mi Mazo',
      MazoCartas: [
        { carta_id: 'c1', Carta: { nombre: 'Sol Ring', embedding } },
      ],
    });
    repo.buscarRecomendaciones.mockResolvedValue([]);

    const res = await service.recomendarCartas('mazo-1', JUGADOR_TEST.id);

    expect(res.recomendaciones).toEqual([]);
    expect(res.explicacion).toBeNull();
    expect(openrouter.generateExplanation).not.toHaveBeenCalled();
  });

  it('TC-MZ-024: si generateExplanation falla, explicación es null pero no se lanza error', async () => {
    const embedding = JSON.stringify([0.5, 0.5]);
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      nombre: 'Mi Mazo',
      MazoCartas: [
        { carta_id: 'c1', Carta: { nombre: 'Sol Ring', embedding } },
      ],
    });
    repo.buscarRecomendaciones.mockResolvedValue([{ nombre: 'Mana Crypt' }]);
    openrouter.generateExplanation.mockRejectedValue(new Error('API timeout'));

    const res = await service.recomendarCartas('mazo-1', JUGADOR_TEST.id);

    expect(res.recomendaciones).toHaveLength(1);
    expect(res.explicacion).toBeNull();
  });
});

// ─── autocompletar ─────────────────────────────────────────────────────────────

describe('mazos.service — autocompletar()', () => {
  it('TC-MZ-025: retorna mensaje si el mazo ya tiene el objetivo de cartas', async () => {
    const cartasActuales = Array.from({ length: 100 }, (_, i) => ({
      carta_id: `c-${i}`,
      cantidad: 1,
      es_comandante: i === 0,
      Carta: { nombre: `Carta ${i}`, tipo: i === 0 ? 'Legendary Creature' : 'Sorcery' },
    }));
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      comandante: null,
      MazoCartas: cartasActuales,
    });

    const res = await service.autocompletar('mazo-1', JUGADOR_TEST.id);

    expect(res.mensaje).toBe('El mazo ya está completo.');
    expect(res.agregadas).toHaveLength(0);
  });

  it('TC-MZ-026: agrega cartas generadas por IA al mazo Standard', async () => {
    const cartasActuales = Array.from({ length: 55 }, (_, i) => ({
      carta_id: `c-${i}`,
      cantidad: 1,
      es_comandante: false,
      Carta: { nombre: `Carta ${i}`, tipo: 'Sorcery' },
    }));
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'STANDARD',
      comandante: null,
      nombre: 'Mi Mazo Standard',
      MazoCartas: cartasActuales,
    });
    openrouter.generarListaMazo.mockResolvedValue(
      '1 Sol Ring\n1 Command Tower\n1 Mana Crypt\n1 Arcane Signet\n1 Birds of Paradise',
    );
    // Cada carta se resuelve con buscarPorNombreExacto
    cartasRepo.buscarPorNombreExacto
      .mockResolvedValueOnce({ id: 'new-1', nombre: 'Sol Ring' })
      .mockResolvedValueOnce({ id: 'new-2', nombre: 'Command Tower' })
      .mockResolvedValueOnce({ id: 'new-3', nombre: 'Mana Crypt' })
      .mockResolvedValueOnce({ id: 'new-4', nombre: 'Arcane Signet' })
      .mockResolvedValueOnce({ id: 'new-5', nombre: 'Birds of Paradise' });
    repo.agregarCarta.mockResolvedValue({});

    const res = await service.autocompletar('mazo-1', JUGADOR_TEST.id);

    expect(res.agregadas).toHaveLength(5);
    expect(res.agregadas[0]).toMatchObject({ nombre: 'Sol Ring', cantidad: 1 });
    // Standard usa cantidad 1 siempre (esCommander es false para STANDARD)
    expect(repo.agregarCarta).toHaveBeenCalledTimes(5);
  });

  it('TC-MZ-027: carta no encontrada en la biblioteca se registra como fallida', async () => {
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'STANDARD',
      comandante: null,
      nombre: 'Mi Mazo',
      MazoCartas: Array.from({ length: 59 }, (_, i) => ({
        carta_id: `c-${i}`,
        cantidad: 1,
        es_comandante: false,
        Carta: { nombre: `Carta ${i}`, tipo: 'Sorcery' },
      })),
    });
    openrouter.generarListaMazo.mockResolvedValue('1 Carta Fantasma');
    cartasRepo.buscarPorNombreExacto.mockResolvedValue(null);
    cartasRepo.buscarPorNombre.mockResolvedValue([]);
    repo.agregarCarta.mockResolvedValue({});

    const res = await service.autocompletar('mazo-1', JUGADOR_TEST.id);

    expect(res.agregadas).toHaveLength(0);
    expect(res.fallidas).toHaveLength(1);
    expect(res.fallidas[0]).toMatchObject({ nombre: 'Carta Fantasma', error: 'No encontrada en la biblioteca' });
  });

  it('TC-MZ-028: cartas duplicadas (ya en el mazo) se registran como fallidas', async () => {
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'STANDARD',
      comandante: null,
      nombre: 'Mi Mazo',
      MazoCartas: [
        { carta_id: 'c-sol', cantidad: 1, es_comandante: false, Carta: { nombre: 'Sol Ring', tipo: 'Artifact' } },
        ...Array.from({ length: 58 }, (_, i) => ({
          carta_id: `c-${i}`,
          cantidad: 1,
          es_comandante: false,
          Carta: { nombre: `Carta ${i}`, tipo: 'Sorcery' },
        })),
      ],
    });
    openrouter.generarListaMazo.mockResolvedValue('1 Sol Ring');
    // buscarPorNombreExacto returns the same card already in the mazo
    cartasRepo.buscarPorNombreExacto.mockResolvedValue({ id: 'c-sol', nombre: 'Sol Ring' });

    const res = await service.autocompletar('mazo-1', JUGADOR_TEST.id);

    expect(res.agregadas).toHaveLength(0);
    expect(res.fallidas).toHaveLength(1);
    expect(res.fallidas[0].error).toMatch(/Ya está en el mazo/);
  });

  it('TC-MZ-029: en Commander agrega el comandante primero si no está en el mazo', async () => {
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'COMMANDER',
      comandante: 'Atraxa, Praetors Voice',
      nombre: 'Mi Mazo Commander',
      MazoCartas: Array.from({ length: 95 }, (_, i) => ({
        carta_id: `c-${i}`,
        cantidad: 1,
        es_comandante: false,
        Carta: { nombre: `Carta ${i}`, tipo: 'Sorcery' },
      })),
    });
    // Resolver el comandante
    cartasRepo.buscarPorNombreExacto
      .mockResolvedValueOnce({ id: 'carta-atraxa', nombre: 'Atraxa, Praetors Voice' })
      // Cartas IA
      .mockResolvedValueOnce({ id: 'new-1', nombre: 'Sol Ring' })
      .mockResolvedValueOnce({ id: 'new-2', nombre: 'Command Tower' })
      .mockResolvedValueOnce({ id: 'new-3', nombre: 'Mana Crypt' })
      .mockResolvedValueOnce({ id: 'new-4', nombre: 'Arcane Signet' });
    repo.agregarCarta.mockResolvedValue({});
    openrouter.generarListaMazo.mockResolvedValue(
      '1 Sol Ring\n1 Command Tower\n1 Mana Crypt\n1 Arcane Signet',
    );
    // Para la segunda buscarPorId al final del flujo Commander
    repo.buscarPorId
      .mockResolvedValueOnce({
        id: 'mazo-1',
        usuario_id: JUGADOR_TEST.id,
        formato: 'COMMANDER',
        comandante: 'Atraxa, Praetors Voice',
        nombre: 'Mi Mazo Commander',
        MazoCartas: Array.from({ length: 95 }, (_, i) => ({
          carta_id: `c-${i}`,
          cantidad: 1,
          es_comandante: false,
          Carta: { nombre: `Carta ${i}`, tipo: 'Sorcery' },
        })),
      })
      .mockResolvedValueOnce({
        id: 'mazo-1',
        usuario_id: JUGADOR_TEST.id,
        formato: 'COMMANDER',
        comandante: 'Atraxa, Praetors Voice',
        MazoCartas: [
          { carta_id: 'carta-atraxa', es_comandante: true, Carta: { nombre: 'Atraxa, Praetors Voice', tipo: 'Legendary Creature' } },
          ...Array.from({ length: 99 }, (_, i) => ({
            carta_id: `c-${i}`,
            cantidad: 1,
            es_comandante: false,
            Carta: { nombre: `Carta ${i}`, tipo: 'Sorcery' },
          })),
        ],
      });

    const res = await service.autocompletar('mazo-1', JUGADOR_TEST.id);

    // First agregarCarta call is for the commander with es_comandante=true
    expect(repo.agregarCarta.mock.calls[0]).toEqual(['mazo-1', 'carta-atraxa', 1, true]);
    expect(res.agregadas[0]).toMatchObject({ nombre: 'Atraxa, Praetors Voice', esComandante: true });
  });

  it('TC-MZ-030: SequelizeUniqueConstraintError durante autocompletar se maneja como carta duplicada', async () => {
    repo.buscarPorId.mockResolvedValue({
      id: 'mazo-1',
      usuario_id: JUGADOR_TEST.id,
      formato: 'STANDARD',
      comandante: null,
      nombre: 'Mi Mazo',
      MazoCartas: Array.from({ length: 59 }, (_, i) => ({
        carta_id: `c-${i}`,
        cantidad: 1,
        es_comandante: false,
        Carta: { nombre: `Carta ${i}`, tipo: 'Sorcery' },
      })),
    });
    openrouter.generarListaMazo.mockResolvedValue('1 New Card');
    cartasRepo.buscarPorNombreExacto.mockResolvedValue({ id: 'new-card', nombre: 'New Card' });
    const uniqueErr = new Error('duplicate');
    uniqueErr.name = 'SequelizeUniqueConstraintError';
    repo.agregarCarta.mockRejectedValue(uniqueErr);

    const res = await service.autocompletar('mazo-1', JUGADOR_TEST.id);

    expect(res.fallidas).toHaveLength(1);
    expect(res.fallidas[0].error).toMatch(/Ya está en el mazo/);
  });
});
