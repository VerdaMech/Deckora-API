import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.js'],
      exclude: [
        'tests/**',
        'scripts/**',
        'node_modules/**',
        'src/database/migrations/**',
        'src/database/seeders/**',
        'src/config/sequelize-config.cjs',
      ],
      thresholds: {
        statements: 65,
        branches: 58,
        functions: 72,
        lines: 65,
      },
    },
    setupFiles: ['./tests/helpers/setup.js'],
  },
});
