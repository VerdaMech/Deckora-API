# Sistema de Recomendaciones Vectoriales — Deckora API

## Cómo funciona

El sistema recomienda cartas de Magic a un jugador basándose en el contenido actual de su mazo, usando similitud semántica entre vectores numéricos. El flujo completo es:

1. Cada carta en la BD tiene un **embedding** (vector de 768 números) que representa su identidad semántica.
2. Cuando se pide recomendaciones, se calcula el **vector promedio** de todas las cartas del mazo.
3. Ese vector promedio se compara contra todos los embeddings de la BD usando **distancia coseno**.
4. Las cartas más cercanas semánticamente (que no estén ya en el mazo) son las recomendadas.
5. Opcionalmente, un LLM genera una explicación en lenguaje natural de por qué esas cartas encajan.

---

## Qué tiene que hacer el frontend/consumidor

Hacer una sola llamada autenticada:

```
GET /mazos/:id/recomendaciones
Authorization: Bearer <jwt_token>
```

### Respuesta exitosa

```json
{
  "recomendaciones": [
    {
      "id": "uuid",
      "nombre": "Lightning Bolt",
      "tipo": "Instant",
      "costo_mana": "{R}",
      "imagen_url": "https://...",
      "texto": "Deal 3 damage to any target.",
      "cmc": 1,
      "colors": ["R"],
      "legalities": { "standard": "not_legal", "commander": "legal" }
    }
  ],
  "explicacion": "Estas cartas complementan tu mazo porque..."
}
```

> `explicacion` puede ser `null` si el modelo de lenguaje falla. Las recomendaciones se devuelven igual.

### Errores posibles

| Código | Motivo |
|--------|--------|
| `403` | El mazo no pertenece al jugador autenticado |
| `404` | El mazo no existe |
| `422` | Ninguna carta del mazo tiene embedding generado aún |

---

## Qué hacen los embeddings

Un embedding convierte el texto descriptivo de una carta en un vector de 768 números. El texto que se vectoriza por carta es:

```
"${tipo} CMC:${cmc} Colors:${colors}"

// Ejemplo: "Instant CMC:1 Colors:R"
```

Cartas similares (mismo tipo, costo, colores) producen vectores matemáticamente cercanos. Esto permite encontrar cartas del mismo estilo sin reglas hardcodeadas: si el mazo tiene muchos instantáneos rojos baratos, el sistema recomienda más instantáneos rojos baratos.

Los vectores se almacenan en la columna `embedding vector(768)` de la tabla `cartas` en PostgreSQL con la extensión **pgvector**. La búsqueda usa el operador `<=>` (distancia coseno) con un índice **HNSW** para que sea eficiente a escala.

---

## Modelos utilizados

| Propósito | Modelo | Proveedor |
|-----------|--------|-----------|
| Generar embeddings | `nomic-ai/nomic-embed-text-v1.5` | OpenRouter |
| Generar explicación | `meta-llama/llama-3.3-70b-instruct:free` | OpenRouter (gratuito) |

Ambos se consumen desde `src/utils/openrouter.js` usando `fetch` nativo (Node 18+).

Variable de entorno requerida: `OPENROUTER_API_KEY`

---

## Cómo funciona el seeder

Archivo: `scripts/generateEmbeddings.js`
Comando: `npm run embed:generate`

Es un script standalone que se ejecuta una sola vez (o cuantas veces sea necesario hasta completar). Su lógica:

```
1. Conecta a la BD y consulta todas las cartas WHERE embedding IS NULL
2. Para cada carta (concurrencia máxima de 3 simultáneas):
   a. Construye el texto: "${tipo} CMC:${cmc} Colors:${colors}"
   b. Llama a OpenRouter para obtener el vector de 768 números
   c. Si falla con 429 (rate limit): espera con backoff exponencial
      (2s → 4s → 8s → 16s) y reintenta hasta 5 veces
   d. Si falla por otro error: reintenta tras 1s, hasta 5 veces
   e. Si agota los 5 reintentos: marca como fallida y continúa
   f. Si tiene éxito: UPDATE cartas SET embedding = $1::vector WHERE id = $2
3. Imprime el progreso cada 100 cartas
4. Al finalizar reporta exitosas vs fallidas
```

### Idempotencia

El script **solo procesa cartas con `embedding IS NULL`**. Si se interrumpe o hay fallidas, se vuelve a ejecutar sin riesgo de duplicar trabajo.

### Tiempo estimado

Con ~35.000 filas y concurrencia 3: entre **2 y 4 horas** dependiendo del rate limit de OpenRouter.

---

## Pasos para poner en marcha

### 1. Configurar variable de entorno

Agregar en `.env`:
```
OPENROUTER_API_KEY=tu_key_aqui
```

Obtener la key en: https://openrouter.ai/keys

### 2. Ejecutar las migraciones

```bash
npm run db:migrate
```

Corre en orden:
- `20260514000001` — redimensiona `embedding` de `vector(1536)` a `vector(768)`
- `20260514000002` — crea el índice HNSW para búsqueda por similitud coseno

> Si ya había datos en la columna `embedding`, se pierden. Es esperado — el seeder los regenera.

### 3. Generar los embeddings

```bash
npm run embed:generate
```

### 4. Verificar en Supabase

```sql
SELECT
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) AS con_embedding,
  COUNT(*) FILTER (WHERE embedding IS NULL)     AS sin_embedding
FROM cartas;
```

### 5. Probar el endpoint

```
GET /mazos/:id/recomendaciones
Authorization: Bearer <token>
```
