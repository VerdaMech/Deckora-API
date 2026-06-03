# Regresión automatizada — Fase 7

> Implementa la **Fase 7** del `PLAN_TESTING.md`: ejecutar la suite completa de
> tests (unit + integration + API + smoke + E2E) como gate antes de mergear a
> `main`, más un subconjunto crítico etiquetado para feedback rápido.

## 1. Niveles de regresión

| Nivel | Comando | Qué corre | Tiempo aprox. | Cuándo usarlo |
|-------|---------|-----------|---------------|---------------|
| **Crítico (rápido)** | `npm run test:regression:critico` | Solo los tests etiquetados `@regression` (lógica de negocio P1) | < 5 s | Feedback inmediato durante el desarrollo |
| **Completo (gate)** | `npm run test:regression` | Backend Vitest + Frontend Vitest + E2E Playwright | ~1–2 min | Antes de mergear a `main` |

### Sub-comandos del nivel completo

| Comando | Qué corre |
|---------|-----------|
| `npm run test:regression:back` | Backend Vitest: unit + integration + API + smoke (141 tests) |
| `npm run test:regression:web` | Frontend Vitest: utils + hooks + componentes (94 tests, en `../../Deckora-Web`) |
| `npm run test:e2e` | E2E Playwright: 10 flujos críticos (TC-E2E-001 → 010) |

El comando completo encadena los tres con `&&`: se detiene en el primer nivel que
falle (fail-fast), que es el comportamiento deseado para un gate de merge.

## 2. La etiqueta `@regression`

El subconjunto crítico se selecciona por **nombre de test**: las suites P1 llevan
`@regression` en el título de su `describe`, y Vitest filtra con `-t "@regression"`.

Suites etiquetadas actualmente:

| Archivo | Suite | Casos |
|---------|-------|-------|
| `tests/unit/estrategias/commander.strategy.test.js` | `commander.strategy — validar()` | TC-CMD-001…010 |
| `tests/unit/estrategias/standard.strategy.test.js` | `standard.strategy — validar()` | TC-STD-001…007 |
| `tests/unit/emparejadores/swiss.emparejador.test.js` | `swiss.emparejador — emparejar()` | TC-SWI-001…010 |
| `tests/unit/middleware/auth.test.js` | `auth middleware` | TC-AUTH-001…007 |
| `tests/unit/middleware/requirePerfil.test.js` | `requirePerfil middleware` | TC-ROL-001…005 |
| `tests/integration/torneos.service.test.js` | `cambiarEstado()` + `inscribir()` | TC-TOR, TC-INS |
| `tests/integration/enfrentamientos.service.test.js` | `registrarResultado()` | TC-ENF-001…009 |

### Cómo agregar una suite al subconjunto crítico

Añade ` @regression` al final del título del `describe` de nivel superior:

```js
describe('mi.modulo — miFuncion() @regression', () => {
  // ...
});
```

Como Vitest hace match contra el nombre completo del test (incluye los `describe`
padre), todos los `it` dentro de esa suite quedan incluidos automáticamente.

## 3. Criterios de aprobación (PLAN_TESTING.md §6.3)

- **Sin falsos positivos:** la suite completa debe correr de forma determinista
  (todos los servicios externos están mockeados; ningún test toca la BD real).
- **Tiempo total < 15 min** (hoy ~1–2 min en local).
- Un fallo en cualquier nivel **bloquea el merge a `main`**.

## 4. Notas de entorno

- **E2E:** Playwright levanta el dev server de `Deckora-Web` automáticamente
  (`webServer` con `reuseExistingServer: true`). Si el dev server ya está corriendo
  en `http://localhost:5173`, lo reutiliza. Requiere el navegador instalado una vez:
  `npx playwright install chromium`.
- **Aislamiento:** los tests de integración y API mockean repositorios, Sequelize,
  Supabase Auth y el servicio de email — no se conectan a producción (Opción C del
  plan, §6.5).

## 5. Próximo paso (Fase 10)

Estos comandos son la base para los workflows de GitHub Actions de la **Fase 10**
(CI/CD): `test:regression:critico` como gate en PRs a `dev`, y `test:regression`
completo como gate en PRs a `main`.
