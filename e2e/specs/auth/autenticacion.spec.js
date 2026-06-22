import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage.js';
import { RegistroPage } from '../../pages/RegistroPage.js';
import { DATOS_REGISTRO_JUGADOR, JUGADOR_E2E } from '../../fixtures/datos-prueba.js';
import { mockSignup } from '../../helpers/mocks.js';

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-002 — Registro de jugador nuevo
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TC-E2E-002: registro de jugador nuevo', () => {
  test('muestra pantalla de verificación o redirige al dashboard tras registro válido', async ({ page }) => {
    // Mock: POST /api/auth/signup
    await mockSignup(page, JUGADOR_E2E);

    // Mock: Supabase signInWithPassword (POST /auth/v1/token) → email no confirmado
    await page.route('**/auth/v1/token*', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'email_not_confirmed',
          error_description: 'Email not confirmed',
        }),
      }),
    );

    // Mock: Supabase para otros endpoints de auth
    await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 200, body: '{}' }));

    const registroPage = new RegistroPage(page);
    await registroPage.goto();
    await registroPage.llenarFormulario(DATOS_REGISTRO_JUGADOR);
    await registroPage.submit();

    // Esperar: o se queda en /registro (mostrando verificación) o va al dashboard
    await expect(page).toHaveURL(/\/jugador|\/registro/, { timeout: 8_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-003 — Login con credenciales válidas
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TC-E2E-003: login con credenciales válidas', () => {
  test('redirige a /jugador tras login exitoso', async ({ page }) => {
    const sesionMock = {
      access_token: 'mock-token-login-e2e',
      refresh_token: 'mock-refresh-login-e2e',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: JUGADOR_E2E.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: JUGADOR_E2E.correo,
      },
    };

    // Mock: Supabase signInWithPassword (POST /auth/v1/token?grant_type=password)
    await page.route('**/auth/v1/token*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sesionMock),
      }),
    );

    // Mock: cualquier otro endpoint de Supabase auth
    await page.route('**/auth/v1/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sesionMock) }),
    );

    // Mock: GET /api/auth/me
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: JUGADOR_E2E.id,
          nombre_usuario: JUGADOR_E2E.nombre_usuario,
          rol: 'jugador',
          activo: true,
          perfil: {},
        }),
      }),
    );

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(JUGADOR_E2E.correo, 'password123');

    // Esperar redirect al dashboard de jugador
    await expect(page).toHaveURL('/jugador', { timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-004 — Login con credenciales inválidas
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TC-E2E-004: login con credenciales inválidas', () => {
  test('muestra mensaje de error al ingresar contraseña incorrecta', async ({ page }) => {
    // Mock: Supabase signInWithPassword → error 400
    await page.route('**/auth/v1/token*', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
      }),
    );

    // Mock: otros endpoints de Supabase
    await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 200, body: '{}' }));

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('noexiste@e2e.local', 'wrongpassword');

    // Esperar mensaje de error — Alert visible en la UI
    await expect(loginPage.alertError).toBeVisible({ timeout: 8_000 });
    // Seguimos en /login (no hubo redirect)
    await expect(page).toHaveURL('/login');
  });
});
