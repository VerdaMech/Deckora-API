# Pruebas de carga — Deckora API

Pruebas de rendimiento y carga usando [k6](https://k6.io). Cubren los endpoints de mayor concurrencia esperada de la plataforma.

## Instalación de k6

k6 es una herramienta independiente, no se instala con npm.

```bash
# Windows (Chocolatey)
choco install k6

# macOS (Homebrew)
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

Verificar instalación:

```bash
k6 version
```

---

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `BASE_URL` | URL base de la API | `http://localhost:3000` |
| `TEST_EMAIL` | Email del usuario de prueba | `test@test.local` |
| `TEST_PASSWORD` | Contraseña del usuario de prueba | `test1234` |
| `TORNEO_ID` | UUID de un torneo existente en la BD de test | (requerido para inscripciones) |
| `MAZO_ID` | UUID de un mazo válido del usuario de prueba | (requerido para inscripciones) |

---

## Escenarios disponibles

### 1. Health check (baseline)

Mide la latencia base del servidor sin carga de negocio.

```bash
k6 run load-tests/scenarios/health-check.js
# o con npm:
npm run test:load:health
```

- 10 VUs durante 30 segundos
- Umbral: p95 < 200ms, error rate < 0.1%

---

### 2. Búsqueda de cartas (carga sostenida)

Simula 50 usuarios consultando la biblioteca de cartas de forma continua.

```bash
k6 run -e BASE_URL=http://localhost:3000 load-tests/scenarios/busqueda-cartas.js
# o con npm:
npm run test:load:cartas
```

- 50 VUs constantes durante 2 minutos
- Umbral: p95 < 800ms, p99 < 1500ms, error rate < 0.5%

---

### 3. Inscripciones concurrentes (carga crítica)

Simula 40 jugadores inscribiéndose en un torneo al mismo tiempo. **Requiere la API levantada y variables de entorno configuradas.**

```bash
k6 run \
  -e BASE_URL=http://localhost:3000 \
  -e TEST_EMAIL=test@test.local \
  -e TEST_PASSWORD=test1234 \
  -e TORNEO_ID=<uuid-torneo> \
  -e MAZO_ID=<uuid-mazo> \
  load-tests/scenarios/inscripciones-concurrentes.js
# o con npm:
npm run test:load
```

- Ramping: 0 → 20 VUs (30s) → 40 VUs (60s) → 0 (30s)
- Umbral: p95 < 500ms, p99 < 1000ms, error rate < 1%

---

### 4. Ciclo de torneo (carga moderada)

Simula usuarios navegando la lista de torneos, el detalle y la tabla de posiciones.

```bash
k6 run -e BASE_URL=http://localhost:3000 load-tests/scenarios/ciclo-torneo.js
# o con npm:
npm run test:load:torneo
```

- Arrival rate: 10 → 100 req/s, máximo 200 VUs
- Umbral: p95 < 500ms, p99 < 1000ms, error rate < 1%

---

## Guardar resultados

Los resultados se guardan en `load-tests/results/` (carpeta excluida de git).

```bash
# Guardar resultados en JSON
k6 run --out json=load-tests/results/inscripciones-$(date +%Y%m%d-%H%M%S).json \
  load-tests/scenarios/inscripciones-concurrentes.js
```

---

## Umbrales de aceptación

| Métrica | Umbral aceptable | Umbral ideal |
|---------|-----------------|-------------|
| Tiempo de respuesta promedio | < 300ms | < 150ms |
| p95 | < 500ms | < 250ms |
| p99 | < 1000ms | < 500ms |
| Tasa de error | < 1% | < 0.1% |
| Throughput (cartas) | > 50 req/s | > 100 req/s |
| Throughput (torneos) | > 20 req/s | > 50 req/s |

---

## Precauciones importantes

> **NUNCA ejecutar estos scripts apuntando a la URL de producción o a la base de datos compartida con producción.**

1. Usar siempre la instancia de testing o un servidor local.
2. Sembrar datos suficientes antes de ejecutar (torneos abiertos, mazos válidos, usuarios de prueba).
3. Los resultados en `load-tests/results/` no se commitean; subir solo bajo demanda.
4. Monitorear la consola del servidor durante las pruebas para detectar errores no capturados.
