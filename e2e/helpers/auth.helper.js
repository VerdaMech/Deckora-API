/**
 * Helper para inyectar sesión autenticada en tests E2E.
 *
 * Estrategia:
 * - Inyecta la sesión directamente en localStorage antes de la carga de la página.
 * - Mockea `/api/auth/me` con glob pattern (no function predicate) para evitar
 *   conflictos con el orden FIFO de page.route().
 * - NO usa catch-all para no interferir con mocks específicos de cada test.
 */

const SUPABASE_STORAGE_KEY = 'sb-vpkugzmyjeakmzkbxbla-auth-token';

/**
 * Configura la página para un usuario autenticado sin pasar por el formulario de login.
 * Debe llamarse ANTES de page.goto().
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} usuario
 */
export async function autenticarComo(page, usuario) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600 * 24 * 365;

  const session = {
    access_token: 'mock-access-token-e2e',
    refresh_token: 'mock-refresh-token-e2e',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user: { id: usuario.id, aud: 'authenticated' },
  };

  const perfilMock = {
    id: usuario.id,
    nombre_usuario: usuario.nombre_usuario,
    correo: usuario.correo ?? `${usuario.nombre_usuario}@e2e.local`,
    rol: usuario.rol,
    activo: true,
    perfil: usuario.perfil ?? {},
  };

  // 1. Inyectar sesión en localStorage ANTES de que el JS corra (addInitScript)
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: SUPABASE_STORAGE_KEY, value: session },
  );

  // 2. Mock de Supabase Auth (cualquier endpoint de auth/v1 → devuelve sesión mock)
  await page.route('**/auth/v1/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    });
  });

  // 3. Mock específico de /api/auth/me con glob (DESPUÉS de **/auth/v1/** en FIFO,
  //    pero como es más específico, el framework suele preferirlo — además ponemos
  //    también la URL exacta como cobertura adicional)
  await page.route('**/api/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(perfilMock),
    });
  });
}
