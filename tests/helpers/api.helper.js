import { mockSupabaseAuthOk, mockSupabaseAuthFail } from './auth.helper.js';

export const TOKEN_JUGADOR = 'Bearer mock-token-jugador';
export const TOKEN_ORGANIZADOR = 'Bearer mock-token-organizador';
export const TOKEN_TIENDA = 'Bearer mock-token-tienda';

export function configurarAuthMock(supabase, Usuario, usuario) {
  supabase.auth.getUser.mockResolvedValue(mockSupabaseAuthOk(usuario.id));
  Usuario.findByPk.mockResolvedValue(usuario);
}

export function configurarSinAuth(supabase) {
  supabase.auth.getUser.mockResolvedValue(mockSupabaseAuthFail());
}

export function crearErrorConStatus(mensaje, status) {
  return Object.assign(new Error(mensaje), { status });
}
