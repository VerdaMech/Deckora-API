// Configuración de ESLint enfocada en seguridad (Fase 8 del PLAN_TESTING.md).
// Aplica las reglas de eslint-plugin-security al código de la aplicación.
// No incluye reglas de estilo: el objetivo aquí es el análisis estático de
// seguridad (SAST), no el linting general.
import security from 'eslint-plugin-security';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'e2e/**',
      'tests/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  security.configs.recommended,
  {
    files: ['src/**/*.js', 'server.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    // No reportar directivas eslint-disable "sin uso": esta config solo activa
    // reglas de seguridad, así que los disable de reglas de estilo del código
    // (p. ej. no-unused-vars) aparecen como no usados sin serlo realmente.
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      // detect-object-injection marca TODO acceso `obj[variable]` (índices de
      // bucle, claves internas controladas), generando casi solo falsos
      // positivos. Se desactiva siguiendo la práctica habitual; la inyección
      // real se previene con validación Zod en los controllers. Las demás
      // reglas de eslint-plugin-security siguen activas.
      'security/detect-object-injection': 'off',
    },
  },
];
