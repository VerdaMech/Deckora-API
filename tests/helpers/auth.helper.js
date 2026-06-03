import { vi } from 'vitest';

export function mockSupabaseAuthOk(userId, extraFields = {}) {
  return {
    data: { user: { id: userId, email: 'test@test.local', ...extraFields } },
    error: null,
  };
}

export function mockSupabaseAuthFail(message = 'Token inválido') {
  return {
    data: { user: null },
    error: new Error(message),
  };
}

export function makeReqResMock(headers = {}) {
  const req = { headers };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}
