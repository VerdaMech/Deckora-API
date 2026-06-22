import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../helpers/datos.js';

export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.001'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/health`);

  check(res, {
    'status es 200': (r) => r.status === 200,
    'responde en menos de 200ms': (r) => r.timings.duration < 200,
    'body contiene ok': (r) => r.json('ok') === true,
  });

  sleep(1);
}
