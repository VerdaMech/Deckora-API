import { describe, it, expect, vi } from 'vitest';

const { capturedArgs } = vi.hoisted(() => {
  const capturedArgs = { url: null, opts: null };
  return { capturedArgs };
});

vi.mock('sequelize', () => {
  const MockSequelize = function (url, opts) {
    capturedArgs.url = url;
    capturedArgs.opts = opts;
    this._isMockInstance = true;
  };
  return { Sequelize: MockSequelize };
});

const { default: sequelize } = await import('../../../src/config/db.js');

describe('config/db.js', () => {
  it('exporta una instancia creada con Sequelize', () => {
    expect(sequelize).toBeDefined();
    expect(sequelize._isMockInstance).toBe(true);
  });

  it('pasa DATABASE_URL y dialect postgres al constructor de Sequelize', () => {
    expect(capturedArgs.url).toBe(process.env.DATABASE_URL);
    expect(capturedArgs.opts).toBeDefined();
    expect(capturedArgs.opts.dialect).toBe('postgres');
  });
});
