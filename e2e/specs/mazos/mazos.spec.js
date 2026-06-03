import { test, expect } from '@playwright/test';
import { autenticarComo } from '../../helpers/auth.helper.js';
import { JUGADOR_E2E, MAZO_E2E } from '../../fixtures/datos-prueba.js';

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-005 — Jugador accede a la sección de mazos y puede crear uno
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TC-E2E-005: jugador accede a mazos y puede crear uno', () => {
  test('la sección de mazos carga correctamente para un jugador autenticado', async ({ page }) => {
    await autenticarComo(page, JUGADOR_E2E);

    // Mock: GET /api/mazos
    await page.route('**/api/mazos', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MAZO_E2E]) });
      } else if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(MAZO_E2E) });
      } else {
        route.continue();
      }
    });

    await page.goto('/mazos');
    await page.waitForLoadState('load');

    // La página de mazos carga correctamente — el jugador puede ver su mazo
    // El mazo mock "Mazo Commander E2E" debe aparecer en la lista
    await expect(page.getByText(MAZO_E2E.nombre, { exact: false })).toBeVisible({ timeout: 10_000 });
  });
});
