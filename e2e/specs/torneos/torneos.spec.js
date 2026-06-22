import { test, expect } from '@playwright/test';
import { TorneosPage } from '../../pages/TorneosPage.js';
import { autenticarComo } from '../../helpers/auth.helper.js';
import { mockMapbox } from '../../helpers/mocks.js';
import {
  JUGADOR_E2E,
  ORGANIZADOR_E2E,
  TORNEO_E2E,
  TORNEO_EN_CURSO_E2E,
  MAZO_E2E,
  INSCRIPCION_E2E,
  INSCRIPCION_APROBADA_E2E,
} from '../../fixtures/datos-prueba.js';

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-006 — Organizador accede al formulario de creación de torneos
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TC-E2E-006: organizador accede al formulario de creación de torneos', () => {
  test('el formulario de creación carga y acepta datos básicos', async ({ page }) => {
    await autenticarComo(page, ORGANIZADOR_E2E);
    await mockMapbox(page);

    // Mock: POST /api/torneos → torneo creado
    await page.route('**/api/torneos', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(TORNEO_E2E) });
      } else if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([TORNEO_E2E]) });
      } else {
        route.continue();
      }
    });

    const torneosPage = new TorneosPage(page);
    await torneosPage.gotoCrear();

    // Esperar que el campo "Nombre" sea visible (formulario renderizado)
    await page.getByLabel('Nombre').waitFor({ state: 'visible', timeout: 10_000 });

    // Verificar que el formulario de creación está accesible para el organizador
    await expect(page.getByLabel('Nombre')).toBeVisible();

    // Llenar el nombre del torneo
    await page.getByLabel('Nombre').fill(TORNEO_E2E.nombre);
    await expect(page.getByLabel('Nombre')).toHaveValue(TORNEO_E2E.nombre);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-007 — Jugador solicita inscripción en torneo
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TC-E2E-007: jugador solicita inscripción en torneo', () => {
  test('el botón "Solicitar inscripción" aparece para jugador en torneo PENDIENTE', async ({ page }) => {
    await autenticarComo(page, JUGADOR_E2E);

    // Mock: GET /api/torneos/:id — torneo PENDIENTE (estado en minúscula como requiere el frontend)
    await page.route(`**/api/torneos/${TORNEO_E2E.id}`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TORNEO_E2E) });
      } else {
        route.continue();
      }
    });

    // Mock: GET/POST /api/torneos/:id/inscripciones
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/inscripciones`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (route.request().method() === 'POST') {
        route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(INSCRIPCION_E2E) });
      } else {
        route.continue();
      }
    });

    // Mock: GET rondas
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/rondas`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    // Mock: GET /api/mazos — mazo del jugador en formato COMMANDER (mismo que el torneo)
    await page.route('**/api/mazos', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MAZO_E2E]) });
      } else {
        route.continue();
      }
    });

    // Mock: GET /api/jugadores/me/* — sin inscripciones previas
    await page.route('**/api/jugadores/me/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    await page.goto(`/torneos/${TORNEO_E2E.id}`);
    await page.waitForLoadState('load');

    // El botón "Solicitar inscripción" debe aparecer (puede estar disabled hasta seleccionar mazo)
    const btnInscribirse = page.getByRole('button', { name: /solicitar inscripción/i });
    await expect(btnInscribirse).toBeVisible({ timeout: 10_000 });

    // Seleccionar el mazo del jugador en el dropdown del panel
    const selectMazo = page.locator('.panel-inscripcion select, [class*="inscripcion"] select').first();
    if (await selectMazo.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await selectMazo.selectOption(MAZO_E2E.id);
    }

    // Click al botón (ahora habilitado tras seleccionar mazo)
    await expect(btnInscribirse).toBeEnabled({ timeout: 3_000 });
    await btnInscribirse.click();
    // El toast aparece con "Solicitud enviada" — puede haber varios elementos, tomamos el primero
    await expect(page.getByText(/solicitud enviada|pendiente/i, { exact: false }).first()).toBeVisible({ timeout: 8_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-008 — Organizador aprueba inscripción (BandejaInscripciones en DetalleTorneo)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TC-E2E-008: organizador aprueba inscripción pendiente', () => {
  test('el botón "Aprobar" aparece y la inscripción se aprueba', async ({ page }) => {
    await autenticarComo(page, ORGANIZADOR_E2E);

    // Mock: GET /api/torneos/:id — estado 'pendiente' para que aparezca BandejaInscripciones
    await page.route(`**/api/torneos/${TORNEO_E2E.id}`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TORNEO_E2E) });
      } else {
        route.continue();
      }
    });

    // Mock: GET /api/torneos/:id/inscripciones
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/inscripciones`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([INSCRIPCION_E2E]) });
      } else {
        route.continue();
      }
    });

    // Mock: BandejaInscripciones llama listarPendientes
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/inscripciones/pendientes`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          ...INSCRIPCION_E2E,
          jugador: { nombre_usuario: JUGADOR_E2E.nombre_usuario, id: JUGADOR_E2E.id },
          torneoNombre: TORNEO_E2E.nombre,
          torneoId: TORNEO_E2E.id,
        }]),
      }),
    );

    // Mock: rondas vacías
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/rondas`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    // Mock: PATCH .../aprobar
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/inscripciones/${INSCRIPCION_E2E.id}/aprobar`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(INSCRIPCION_APROBADA_E2E) }),
    );

    await page.goto(`/torneos/${TORNEO_E2E.id}`);
    await page.waitForLoadState('load');

    // El botón "Aprobar" debe aparecer (BandejaInscripciones con estado pendiente)
    await expect(page.getByRole('button', { name: /aprobar/i }).first()).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /aprobar/i }).first().click();

    // Tras aprobación: la inscripción desaparece de la bandeja (setSolicitudes filtra)
    // El toast puede desaparecer antes del check, por eso verificamos el estado del DOM
    await expect(page.getByRole('button', { name: /aprobar/i })).toHaveCount(0, { timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-009 — Organizador publica torneo (PENDIENTE → EN_CURSO)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TC-E2E-009: organizador publica torneo cambiando estado a EN_CURSO', () => {
  test('"Publicar torneo" aparece para organizador y completa la transición de estado', async ({ page }) => {
    await autenticarComo(page, ORGANIZADOR_E2E);

    // Mock: GET /api/torneos/:id — estado 'pendiente'
    await page.route(`**/api/torneos/${TORNEO_E2E.id}`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TORNEO_E2E) });
      } else {
        route.continue();
      }
    });

    // Mock: inscripciones y pendientes vacías
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/inscripciones`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/inscripciones/pendientes`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/rondas`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    // Mock: PATCH /api/torneos/:id/estado → EN_CURSO
    await page.route(`**/api/torneos/${TORNEO_E2E.id}/estado`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TORNEO_EN_CURSO_E2E),
      }),
    );

    await page.goto(`/torneos/${TORNEO_E2E.id}`);
    await page.waitForLoadState('load');

    // "Publicar torneo" aparece para organizador cuando estado === 'pendiente'
    await expect(page.getByRole('button', { name: /publicar torneo/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /publicar torneo/i }).click();

    // Modal de confirmación si aparece
    const btnConfirmar = page.getByRole('button', { name: /confirmar|publicar/i }).last();
    if (await btnConfirmar.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await btnConfirmar.click();
    }

    // El botón "Finalizar torneo" aparece — indica que el torneo está EN_CURSO
    await expect(page.getByRole('button', { name: /finalizar torneo/i })).toBeVisible({ timeout: 8_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TC-E2E-010 — Jugador bloqueado en ruta protegida de organizador
// ═══════════════════════════════════════════════════════════════════════════

test.describe('TC-E2E-010: jugador es bloqueado en ruta protegida de organizador', () => {
  test('navegar a /organizador/torneos/nuevo redirige a /forbidden', async ({ page }) => {
    await autenticarComo(page, JUGADOR_E2E);

    await page.goto('/organizador/torneos/nuevo');
    await page.waitForLoadState('load');

    // ProtectedRoute redirige al jugador a /forbidden (rol insuficiente)
    await expect(page).toHaveURL('/forbidden', { timeout: 8_000 });
  });
});
