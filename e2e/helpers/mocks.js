/**
 * Helpers de interception de red para tests E2E.
 * Usa page.route() de Playwright para interceptar y responder con datos mock.
 */

/**
 * Intercepta una URL con un patrón y devuelve una respuesta JSON mock.
 * @param {import('@playwright/test').Page} page
 * @param {string|RegExp} patron - Patrón de URL a interceptar
 * @param {object} respuesta - Cuerpo JSON de la respuesta
 * @param {number} [status=200] - HTTP status code
 */
export async function mockRuta(page, patron, respuesta, status = 200) {
  await page.route(patron, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(respuesta),
    });
  });
}

/**
 * Intercepta las llamadas al geocoding de Mapbox con una respuesta de Santiago.
 */
export async function mockMapbox(page) {
  await page.route('**/api.mapbox.com/**', route => {
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        features: [
          {
            id: 'place.santiago',
            place_name: 'Santiago, Chile',
            center: [-70.6, -33.4],
            geometry: { type: 'Point', coordinates: [-70.6, -33.4] },
          },
        ],
      }),
    });
  });
}

/**
 * Intercepta el endpoint de Supabase signInWithPassword y devuelve error 400.
 */
export async function mockSupabaseSignInError(page, mensaje = 'Invalid login credentials') {
  await page.route('**/auth/v1/token**', route => {
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'invalid_grant', error_description: mensaje }),
    });
  });
}

/**
 * Intercepta el endpoint de signup del backend (POST /api/auth/signup) con éxito.
 */
export async function mockSignup(page, usuario) {
  await page.route(url => url.pathname.endsWith('/auth/signup'), route => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Usuario creado', usuario }),
      });
    } else {
      route.continue();
    }
  });
}
