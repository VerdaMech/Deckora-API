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
      exclude: ['tests/**', 'scripts/**', 'node_modules/**'],
      include: [
        'src/middleware/auth.js',
        'src/modules/estrategias/**',
        'src/modules/rondas/emparejadores/**',
        'src/modules/auth/auth.service.js',
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 85,
        lines: 90,
      },
    },
    setupFiles: ['./tests/helpers/setup.js'],
  },
});
