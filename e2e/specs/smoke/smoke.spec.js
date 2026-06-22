import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-001 — Smoke: la aplicación carga sin errores de consola
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Smoke E2E — carga de la aplicación', () => {
  test('TC-E2E-001: la app carga en / sin errores de consola críticos', async ({ page }) => {
    const errores = [];
    page.on('pageerror', (err) => errores.push(err.message));

    // Mock mínimo: evitar llamadas reales a Supabase al verificar sesión
    await page.route('**/auth/v1/session**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ data: { session: null }, error: null }) }),
    );
    await page.route('**/auth/v1/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }),
    );

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // La landing debe ser visible (el título principal o algún elemento de la UI)
    await expect(page.locator('body')).toBeVisible();

    // Sin errores JS críticos en la consola
    expect(errores).toHaveLength(0);
  });
});
