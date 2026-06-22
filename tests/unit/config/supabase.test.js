import { describe, it, expect, vi } from 'vitest';

const { fakeClient, capturedArgs } = vi.hoisted(() => {
  const fakeClient = { auth: { getUser: vi.fn() }, from: vi.fn() };
  const capturedArgs = { url: null, key: null };
  return { fakeClient, capturedArgs };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: (url, key) => {
    capturedArgs.url = url;
    capturedArgs.key = key;
    return fakeClient;
  },
}));

const { default: supabase } = await import('../../../src/config/supabase.js');

describe('config/supabase.js', () => {
  it('exporta el cliente creado por createClient con las variables de entorno', () => {
    expect(supabase).toBe(fakeClient);
    expect(capturedArgs.url).toBe(process.env.SUPABASE_URL);
    expect(capturedArgs.key).toBe(process.env.SUPABASE_ANON_KEY);
  });
});
