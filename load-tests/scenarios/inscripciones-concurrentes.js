import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { obtenerToken } from '../helpers/auth.js';
import { BASE_URL, TORNEO_ID, MAZO_ID, headersAuth } from '../helpers/datos.js';

const inscripcionesExitosas = new Counter('inscripciones_exitosas');
const inscripcionesFallidas = new Counter('inscripciones_fallidas');
const tendenciaInscripcion = new Trend('duracion_inscripcion');

export const options = {
  scenarios: {
    inscripciones: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '60s', target: 40 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    duracion_inscripcion: ['p(95)<500'],
  },
};

export function setup() {
  if (!TORNEO_ID) {
    throw new Error('Se requiere la variable de entorno TORNEO_ID para este escenario.');
  }
  if (!MAZO_ID) {
    throw new Error('Se requiere la variable de entorno MAZO_ID para este escenario.');
  }
  const token = obtenerToken();
  return { token };
}

export default function (data) {
  const headers = headersAuth(data.token);
  const payload = JSON.stringify({ mazo_id: MAZO_ID });

  const res = http.post(
    `${BASE_URL}/api/torneos/${TORNEO_ID}/inscripciones`,
    payload,
    { headers },
  );

  tendenciaInscripcion.add(res.timings.duration);

  const exitoso = check(res, {
    'inscripción responde 201 o 409': (r) => r.status === 201 || r.status === 409,
    'responde en menos de 500ms': (r) => r.timings.duration < 500,
  });

  if (res.status === 201) {
    inscripcionesExitosas.add(1);
  } else {
    inscripcionesFallidas.add(1);
  }

  sleep(0.5);
}
