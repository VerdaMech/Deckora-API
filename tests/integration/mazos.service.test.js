import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JUGADOR_TEST } from '../fixtures/usuarios.fixture.js';
import { COMMANDER_VALIDO } from '../fixtures/mazos.fixture.js';
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
