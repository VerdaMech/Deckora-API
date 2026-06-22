# Checklist de seguridad — Fase 8

> Implementa la **Fase 8** del `PLAN_TESTING.md`: auditoría de dependencias,
> análisis estático de seguridad (SAST) y revisión del checklist de seguridad
> contra el **código real** (no contra suposiciones del plan).
>
> Fecha de revisión: 2026-06-03 · Rama: `test/seguridad-basica-fase8`

## 1. Auditoría de dependencias (`npm audit`)

### Backend (`Deckora-API`)

Estado inicial: **6 vulnerabilidades (5 moderate, 1 high)**.

Tras `npm audit fix` (sin `--force`, sin cambios rompedores):

| Paquete | Severidad | Estado |
|---------|-----------|--------|
| `js-cookie` (≤3.0.5, prototype hijack) | **High** | ✅ Resuelta |
| `brace-expansion` (ReDoS) | Moderate | ✅ Resuelta |
| `qs` (DoS en stringify) | Moderate | ✅ Resuelta |
| `ws` (memory disclosure) | Moderate | ✅ Resuelta |
| `uuid` (<11.1.1) vía `sequelize` | Moderate | ⚠️ **Aceptada** |

**`uuid` aceptada:** es transitiva de `sequelize@6`. El único fix (`npm audit fix
--force`) instala `sequelize@3.30.0`, un downgrade que rompe toda la capa de
datos. El advisory aplica solo al usar `uuid` v3/v5/v6 pasando un `buf`
explícito, algo que Sequelize no expone a entrada de usuario. Se acepta hasta
que Sequelize actualice su dependencia. Revisar en cada `npm audit`.

> **Criterio del plan (§6.3) cumplido:** 0 vulnerabilidades **altas o críticas**
> sin resolver. El gate `npm run audit` usa `--audit-level=high` y queda en verde.

### Frontend (`Deckora-Web`)

**2 vulnerabilidades moderate** (`brace-expansion`, `ws`), ambas con fix
no-rompedor. **No se modificó** el repo del frontend en esta rama para no mezclar
trabajo de fases distintas. **Acción recomendada:** correr `npm audit fix` en una
rama propia del frontend. Sin vulnerabilidades altas/críticas.

## 2. Análisis estático de seguridad (`eslint-plugin-security`)

- Configurado en `eslint.config.js` (flat config, solo reglas de seguridad).
- Script: **`npm run lint:security`** → **0 problemas**.
- `security/detect-object-injection`: **desactivada** (marca todo acceso
  `obj[variable]`; casi solo falsos positivos —índices de bucle, claves internas—).
  Las inyecciones reales se previenen con validación Zod en los controllers.
- `security/detect-unsafe-regex`: **activa**. Las 2 coincidencias en
  `torneos.schema.js` se revisaron (regex de fecha lineal y acotado, sin ReDoS) y
  llevan `eslint-disable-next-line` con justificación.

## 3. Checklist manual (PLAN_TESTING.md §11.3) — revisado contra el código

| # | Ítem | Estado | Detalle |
|---|------|--------|---------|
| 1 | CORS restringido a dominios | ❌ Pendiente | `src/app.js:19` usa `app.use(cors())` (origen abierto). OK en dev; restringir antes de prod pública. |
| 2 | Rate limiting en `/api/auth/*` | ❌ Pendiente | No hay `express-rate-limit`. Login/signup sin protección de fuerza bruta. |
| 3 | `SUPABASE_SERVICE_KEY` fuera del frontend | ✅ N/A | **El código no usa service key.** `config/supabase.js` usa `SUPABASE_ANON_KEY` solo para verificar tokens; la BD se accede por Postgres directo (`DATABASE_URL`). No hay key con bypass de RLS en el repo. |
| 4 | `.env` en `.gitignore` | ✅ OK | Ignorado en backend y frontend. |
| 5 | Headers de seguridad (Helmet) | ❌ Pendiente | Helmet no está instalado. Recomendado antes de prod. |
| 6 | Límite de tamaño de body | ❌ Pendiente | `express.json()` sin `limit`. Recomendado `{ limit: '1mb' }`. |
| 7 | Autorización horizontal (IDOR) | ✅ Cubierto | El dueño del torneo se valida en el service; con tests de regresión (TC-TOR-006, TC-ENF-006, TC-INS-004). |
| 8 | `DATABASE_URL` de prod nunca en tests | ✅ OK | La suite mockea repositorios/Sequelize/Supabase; ningún test se conecta a la BD real. |
| 9 | Entorno de test sin credenciales de prod | ✅ OK | No hay `.env.test` con secretos reales; suite 100% mockeada. |
| 10 | JWT no cacheado de forma insegura | ⚠️ Revisar | Frontend: la sesión la gestiona el SDK de Supabase. Revisar persistencia en `localStorage`. |

## 4. Pruebas de seguridad automatizables (§11.2)

| Prueba | Herramienta | Estado |
|--------|-------------|--------|
| Vulnerabilidades en dependencias | `npm run audit` | ✅ Listo |
| Análisis estático (SAST) | `npm run lint:security` | ✅ Listo |
| Acceso cruzado entre usuarios (IDOR) | Vitest (TC-TOR-006, TC-INS-004…) | ✅ En regresión |
| Headers de seguridad HTTP | Helmet + smoke | ❌ Pendiente |
| Fuerza bruta en auth | k6 / script | ⏭️ Fase 9 (carga) |
| Secretos commiteados | trufflehog / git-secrets | ❌ No configurado |

## 5. Acciones recomendadas (siguiente iteración, antes de producción)

1. **CORS:** whitelist de orígenes (dominios de Vercel) — coordinar con D6 para no romper E2E.
2. **Helmet:** `app.use(helmet())` para headers de seguridad.
3. **Rate limiting:** `express-rate-limit` en `/api/auth/login` y `/signup`.
4. **Body limit:** `express.json({ limit: '1mb' })`.
5. **Frontend:** correr `npm audit fix` (2 moderate) en su propia rama.

> Estas acciones se dejan **documentadas y no implementadas** en esta fase: varias
> (CORS, rate limiting) pueden afectar el entorno de pruebas/E2E y requieren la
> decisión D6 del plan. La Fase 8 entrega la auditoría, el SAST y este checklist.

## 6. Comandos

```bash
npm run audit           # gate: falla solo con vulnerabilidades high/critical
npm run audit:report    # genera security/audit-report.json (evidencia, gitignored)
npm run lint:security   # SAST con eslint-plugin-security (debe dar 0 problemas)
```
