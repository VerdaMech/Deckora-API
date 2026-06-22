import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, CREDENCIALES_TEST, HEADERS_JSON } from './datos.js';

export function obtenerToken() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(CREDENCIALES_TEST),
    { headers: HEADERS_JSON },
  );

  check(res, {
    'login exitoso en setup': (r) => r.status === 200,
  });

  const body = res.json();
  if (!body || !body.access_token) {
    throw new Error(
      `No se pudo obtener token de auth. Status: ${res.status}. ` +
      `Verifica las variables TEST_EMAIL y TEST_PASSWORD.`,
    );
  }

  return body.access_token;
}
