import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JUGADOR_TEST, ORGANIZADOR_TEST, TIENDA_TEST } from '../fixtures/usuarios.fixture.js';

// ─── Mocks de dependencias del service ───────────────────────────────────────

vi.mock('../../src/modules/usuarios/usuarios.repository.js', () => ({
  buscarPorUsername: vi.fn(),
}));

const repo = await import('../../src/modules/usuarios/usuarios.repository.js');
const service = await import('../../src/modules/usuarios/usuarios.service.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usuarios.service — obtenerPorUsername', () => {
  it('TC-USR-001: devuelve usuario con perfil Jugador fusionado', async () => {
    repo.buscarPorUsername.mockResolvedValue({
      toJSON: () => ({
        id: JUGADOR_TEST.id,
        nombre_usuario: JUGADOR_TEST.nombre_usuario,
        correo: 'jugador@test.com',
        rol: 'jugador',
        Jugador: { usuario_id: JUGADOR_TEST.id, formato_preferido: 'COMMANDER' },
        Organizador: null,
        Tienda: null,
      }),
    });

    const res = await service.obtenerPorUsername('jugador_test');

    expect(res).toEqual({
      id: JUGADOR_TEST.id,
      nombre_usuario: 'jugador_test',
      correo: 'jugador@test.com',
      rol: 'jugador',
      usuario_id: JUGADOR_TEST.id,
      formato_preferido: 'COMMANDER',
    });
    expect(repo.buscarPorUsername).toHaveBeenCalledWith('jugador_test');
  });

  it('TC-USR-002: devuelve usuario con perfil Organizador fusionado', async () => {
    repo.buscarPorUsername.mockResolvedValue({
      toJSON: () => ({
        id: ORGANIZADOR_TEST.id,
        nombre_usuario: ORGANIZADOR_TEST.nombre_usuario,
        correo: 'org@test.com',
        rol: 'organizador',
        Jugador: null,
        Organizador: {
          usuario_id: ORGANIZADOR_TEST.id,
          descripcion: 'Org de prueba',
          sitio_web: 'https://org.test',
          verificado: true,
        },
        Tienda: null,
      }),
    });

    const res = await service.obtenerPorUsername('org_test');

    expect(res).toEqual({
      id: ORGANIZADOR_TEST.id,
      nombre_usuario: 'org_test',
      correo: 'org@test.com',
      rol: 'organizador',
      usuario_id: ORGANIZADOR_TEST.id,
      descripcion: 'Org de prueba',
      sitio_web: 'https://org.test',
      verificado: true,
    });
  });

  it('TC-USR-003: usuario no encontrado devuelve 404', async () => {
    repo.buscarPorUsername.mockResolvedValue(null);

    await expect(service.obtenerPorUsername('fantasma')).rejects.toMatchObject({
      status: 404,
      message: 'Usuario no encontrado',
    });
  });
});
