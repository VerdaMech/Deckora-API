// __ENV es una variable global de k6, no requiere import

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const TORNEO_ID = __ENV.TORNEO_ID || '';
export const MAZO_ID = __ENV.MAZO_ID || '';

export const CREDENCIALES_TEST = {
  email: __ENV.TEST_EMAIL || 'test@test.local',
  password: __ENV.TEST_PASSWORD || 'test1234',
};

export const HEADERS_JSON = {
  'Content-Type': 'application/json',
};

export function headersAuth(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
