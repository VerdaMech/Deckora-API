import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, HEADERS_JSON } from '../helpers/datos.js';

const tendenciaListado = new Trend('duracion_listado_torneos');
const tendenciaDetalle = new Trend('duracion_detalle_torneo');
const tendenciaPosiciones = new Trend('duracion_tabla_posiciones');

export const options = {
  scenarios: {
    usuarios_activos: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 200,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    duracion_listado_torneos: ['p(95)<400'],
    duracion_detalle_torneo: ['p(95)<400'],
    duracion_tabla_posiciones: ['p(95)<500'],
  },
};

export default function () {
  // Paso 1: listar torneos
  const resList = http.get(`${BASE_URL}/api/torneos`, { headers: HEADERS_JSON });
  tendenciaListado.add(resList.timings.duration);

  check(resList, {
    'listado de torneos responde 200': (r) => r.status === 200,
    'listado responde en menos de 400ms': (r) => r.timings.duration < 400,
  });

  const torneos = resList.json();
  if (!Array.isArray(torneos) || torneos.length === 0) {
    sleep(1);
    return;
  }

  // Paso 2: detalle del primer torneo disponible
  const torneo = torneos[Math.floor(Math.random() * Math.min(torneos.length, 5))];
  const resDetalle = http.get(`${BASE_URL}/api/torneos/${torneo.id}`, { headers: HEADERS_JSON });
  tendenciaDetalle.add(resDetalle.timings.duration);

  check(resDetalle, {
    'detalle de torneo responde 200': (r) => r.status === 200,
    'detalle responde en menos de 400ms': (r) => r.timings.duration < 400,
  });

  sleep(0.5);

  // Paso 3: tabla de posiciones del mismo torneo
  const resPosiciones = http.get(
    `${BASE_URL}/api/torneos/${torneo.id}/tabla-posiciones`,
    { headers: HEADERS_JSON },
  );
  tendenciaPosiciones.add(resPosiciones.timings.duration);

  check(resPosiciones, {
    'tabla de posiciones responde 200 o 404': (r) => r.status === 200 || r.status === 404,
    'posiciones responde en menos de 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
