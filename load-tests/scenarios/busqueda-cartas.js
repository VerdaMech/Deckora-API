import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, HEADERS_JSON } from '../helpers/datos.js';

const tendenciaBusqueda = new Trend('duracion_busqueda_cartas');

export const options = {
  scenarios: {
    carga_sostenida: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.005'],
    duracion_busqueda_cartas: ['p(95)<800'],
  },
};

const PAGINAS = 30;
const TERMINOS_BUSQUEDA = ['dragon', 'elf', 'sword', 'fire', 'forest', 'island', 'plains'];

export default function () {
  const pagina = Math.ceil(Math.random() * PAGINAS);
  const url = `${BASE_URL}/api/biblioteca/cartas?limit=20&page=${pagina}`;

  const res = http.get(url, { headers: HEADERS_JSON });

  tendenciaBusqueda.add(res.timings.duration);

  check(res, {
    'status es 200': (r) => r.status === 200,
    'responde en menos de 800ms': (r) => r.timings.duration < 800,
    'body es array': (r) => Array.isArray(r.json()),
  });

  // Simular búsqueda por término en la siguiente petición
  const termino = TERMINOS_BUSQUEDA[Math.floor(Math.random() * TERMINOS_BUSQUEDA.length)];
  const resBusqueda = http.get(
    `${BASE_URL}/api/biblioteca/cartas?limit=20&page=1&q=${termino}`,
    { headers: HEADERS_JSON },
  );

  check(resBusqueda, {
    'búsqueda con término responde 200': (r) => r.status === 200,
  });

  sleep(1);
}
