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
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
    setupFiles: ['./tests/helpers/setup.js'],
  },
});
