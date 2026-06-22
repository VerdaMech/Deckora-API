import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UniqueConstraintError } from 'sequelize';

// ─── Mocks de dependencias del service ───────────────────────────────────────

vi.mock('../../src/config/supabase.js', () => ({
  default: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      admin: { deleteUser: vi.fn() },
    },
  },
}));

vi.mock('../../src/models/index.js', () => ({
  Usuario: { create: vi.fn(), update: vi.fn() },
  Jugador: { create: vi.fn() },
  Organizador: { create: vi.fn() },
  Tienda: { create: vi.fn() },
  Estadistica: { create: vi.fn() },
}));

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario, Jugador, Organizador, Tienda, Estadistica } = await import(
  '../../src/models/index.js'
);
const service = await import('../../src/modules/auth/auth.service.js');

const DATOS_BASE = {
  nombre_usuario: 'jugador_test',
  correo: 'jugador@test.local',
  password: 'Secreta123',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auth.service — signup()', () => {
  it('TC-AUTHSVC-001: registra un jugador creando Usuario, Jugador y Estadistica', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'uid-1' }, session: { access_token: 'tok-1' } },
      error: null,
    });
    Usuario.create.mockResolvedValue({ id: 'uid-1', nombre_usuario: 'jugador_test', rol: 'jugador' });
    Jugador.create.mockResolvedValue({});
    Estadistica.create.mockResolvedValue({});

    const res = await service.signup({ ...DATOS_BASE, rol: 'jugador' });

    expect(Usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'uid-1', rol: 'jugador' }),
    );
    expect(Jugador.create).toHaveBeenCalledWith({ usuario_id: 'uid-1' });
    expect(Estadistica.create).toHaveBeenCalledOnce();
    expect(res.access_token).toBe('tok-1');
  });

  it('TC-AUTHSVC-002: registra un organizador creando Organizador (sin Jugador)', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'uid-1' }, session: null },
      error: null,
    });
    Usuario.create.mockResolvedValue({ id: 'uid-1', rol: 'organizador' });
    Organizador.create.mockResolvedValue({});

    await service.signup({ ...DATOS_BASE, rol: 'organizador' });

    expect(Organizador.create).toHaveBeenCalledWith({ usuario_id: 'uid-1' });
    expect(Jugador.create).not.toHaveBeenCalled();
  });

  it('TC-AUTHSVC-003: registra una tienda con su nombre_tienda', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'uid-1' }, session: null },
      error: null,
    });
    Usuario.create.mockResolvedValue({ id: 'uid-1', rol: 'tienda' });
    Tienda.create.mockResolvedValue({});

    await service.signup({ ...DATOS_BASE, rol: 'tienda', nombre_tienda: 'Mi Tienda' });

    expect(Tienda.create).toHaveBeenCalledWith({ usuario_id: 'uid-1', nombre_tienda: 'Mi Tienda' });
  });

  it('TC-AUTHSVC-004: si Supabase Auth falla devuelve 400 y no crea perfil', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'email inválido' },
    });

    await expect(service.signup({ ...DATOS_BASE, rol: 'jugador' })).rejects.toMatchObject({
      status: 400,
    });
    expect(Usuario.create).not.toHaveBeenCalled();
  });

  it('TC-AUTHSVC-005: un correo duplicado devuelve 409 y revierte el usuario en Supabase', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'uid-1' }, session: null },
      error: null,
    });
    Usuario.create.mockRejectedValue(new UniqueConstraintError({}));

    await expect(service.signup({ ...DATOS_BASE, rol: 'jugador' })).rejects.toMatchObject({
      status: 409,
    });
    expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('uid-1');
  });

  it('TC-AUTHSVC-006: un error genérico de BD devuelve 422 y revierte el usuario', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'uid-1' }, session: null },
      error: null,
    });
    Usuario.create.mockRejectedValue(new Error('db caída'));

    await expect(service.signup({ ...DATOS_BASE, rol: 'jugador' })).rejects.toMatchObject({
      status: 422,
    });
    expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('uid-1');
  });
});

describe('auth.service — login() / cuenta', () => {
  it('TC-AUTHSVC-007: login válido devuelve access_token y usuario', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'tok-9' }, user: { id: 'uid-1' } },
      error: null,
    });

    const res = await service.login({ correo: 'jugador@test.local', password: 'Secreta123' });

    expect(res.access_token).toBe('tok-9');
    expect(res.usuario).toEqual({ id: 'uid-1' });
  });

  it('TC-AUTHSVC-008: login con credenciales incorrectas devuelve 401', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      service.login({ correo: 'jugador@test.local', password: 'mala' }),
    ).rejects.toMatchObject({ status: 401, message: expect.stringMatching(/incorrectos/) });
  });

  it('TC-AUTHSVC-009: eliminarCuenta marca el usuario como inactivo (soft delete)', async () => {
    Usuario.update.mockResolvedValue([1]);

    await service.eliminarCuenta('uid-1');

    expect(Usuario.update).toHaveBeenCalledWith({ activo: false }, { where: { id: 'uid-1' } });
  });

  it('TC-AUTHSVC-010: logout cierra la sesión en Supabase', async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null });

    await service.logout();

    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });
});
