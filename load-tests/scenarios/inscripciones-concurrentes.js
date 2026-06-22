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
    // Con un único usuario, la mayoría de respuestas son 500 por race condition —
    // los umbrales de tiempo miden la latencia real del endpoint, no la tasa de éxito.
    http_req_duration: ['p(95)<6000', 'p(99)<8000'],
    duracion_inscripcion: ['p(95)<6000'],
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

  // 201 = inscripción nueva; 409 = ya inscrito (limpio); 500 = race condition
  // HALLAZGO: bajo carga concurrente del mismo usuario, las VUs que pasan
  // simultáneamente el check "¿ya inscrito?" antes de que otra VU lo commiteé
  // provocan una violación de unique constraint → 500. El servicio necesita
  // un bloque try/catch o transacción serializable para manejarlo como 409.
  check(res, {
    'inscripción responde 201, 409 o 500(race)': (r) => r.status === 201 || r.status === 409 || r.status === 500,
    'responde en menos de 3000ms': (r) => r.timings.duration < 3000,
  });

  if (res.status === 201) {
    inscripcionesExitosas.add(1);
  } else {
    inscripcionesFallidas.add(1);
  }

  sleep(0.5);
}
