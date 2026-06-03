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
    },
    setupFiles: ['./tests/helpers/setup.js'],
  },
});
