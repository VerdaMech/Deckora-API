import 'dotenv/config';
import { Pool } from 'pg';
import { generateEmbedding, generateEmbeddingsBatch } from '../src/utils/openrouter.js';
import pLimit from 'p-limit';

const BATCH_SIZE = 50;         // cartas por llamada a la API
const CONCURRENCIA = 5;        // batches simultáneos
const MAX_REINTENTOS = 5;
const DELAY_BASE_MS = 1000;

const limit = pLimit(CONCURRENCIA);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildTexto(carta) {
  return `${carta.tipo ?? ''} CMC:${carta.cmc ?? 0} Colors:${carta.colors?.join(',') ?? 'none'}`;
}

async function withRetry(fn, etiqueta) {
  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
      return await fn();
    } catch (err) {
      if (intento === MAX_REINTENTOS) throw err;
      const espera = err.message.includes('429')
        ? DELAY_BASE_MS * 2 ** intento   // backoff exponencial en rate limit: 2s, 4s, 8s, 16s
        : DELAY_BASE_MS;
      console.warn(`[${etiqueta}] intento ${intento}/${MAX_REINTENTOS} falló. Reintentando en ${espera / 1000}s...`);
      await sleep(espera);
    }
  }
}

// Un solo UPDATE para todo el batch usando unnest — elimina N round-trips a la BD
async function guardarEmbeddingsBatch(pool, cartas, embeddings) {
  const ids = cartas.map((c) => c.id);
  const embStrings = embeddings.map((e) => `[${e.join(',')}]`);

  await pool.query(
    `UPDATE cartas SET embedding = v.emb::vector
     FROM (SELECT unnest($1::uuid[]) AS id, unnest($2::text[]) AS emb) AS v
     WHERE cartas.id = v.id`,
    [ids, embStrings],
  );
}

// Fallback: guarda un único embedding (usado solo cuando el batch API falla)
async function guardarEmbedding(pool, cartaId, embedding) {
  await pool.query(
    'UPDATE cartas SET embedding = $1::vector WHERE id = $2',
    [`[${embedding.join(',')}]`, cartaId],
  );
}

async function procesarBatch(pool, cartas) {
  const textos = cartas.map(buildTexto);
  const etiqueta = `batch [${cartas[0].id.slice(0, 8)}…]`;

  let embeddings;
  try {
    embeddings = await withRetry(() => generateEmbeddingsBatch(textos), etiqueta);
  } catch {
    // si el batch API falla definitivamente, reintenta carta por carta
    console.warn(`${etiqueta} agotó reintentos. Procesando carta por carta...`);
    let ok = 0;
    let fail = 0;
    for (const carta of cartas) {
      try {
        const emb = await withRetry(
          () => generateEmbedding(buildTexto(carta)),
          `carta ${carta.id.slice(0, 8)}`,
        );
        await guardarEmbedding(pool, carta.id, emb);
        ok++;
      } catch (e) {
        console.error(`[carta ${carta.id}] falló definitivamente: ${e.message}`);
        fail++;
      }
    }
    return { ok, fail };
  }

  try {
    await guardarEmbeddingsBatch(pool, cartas, embeddings);
    return { ok: cartas.length, fail: 0 };
  } catch (err) {
    console.error(`${etiqueta} error al guardar en BD: ${err.message}`);
    return { ok: 0, fail: cartas.length };
  }
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: CONCURRENCIA + 2,
  });

  const { rows: cartas } = await pool.query(
    'SELECT id, tipo, cmc, colors FROM cartas WHERE embedding IS NULL',
  );

  const total = cartas.length;
  console.log(`Cartas sin embedding: ${total}`);

  if (total === 0) {
    console.log('Nada que procesar.');
    await pool.end();
    return;
  }

  const batches = [];
  for (let i = 0; i < cartas.length; i += BATCH_SIZE) {
    batches.push(cartas.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `Procesando en ${batches.length} batches de hasta ${BATCH_SIZE} cartas (concurrencia: ${CONCURRENCIA})`,
  );

  let procesadas = 0;
  let fallidas = 0;
  let batchesCompletados = 0;
  const startedAt = Date.now();

  const tareas = batches.map((batch) =>
    limit(async () => {
      const { ok, fail } = await procesarBatch(pool, batch);
      procesadas += ok;
      fallidas += fail;
      batchesCompletados++;

      if (batchesCompletados % 5 === 0 || batchesCompletados === batches.length) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
        const pct = (((procesadas + fallidas) / total) * 100).toFixed(1);
        process.stdout.write(
          `\rProgreso: ${procesadas + fallidas}/${total} (${pct}%) — batch ${batchesCompletados}/${batches.length} — ${elapsed}s`,
        );
      }
    }),
  );

  await Promise.all(tareas);

  const totalTime = ((Date.now() - startedAt) / 1000).toFixed(0);
  console.log(`\n\nFinalizado: ${procesadas} exitosas, ${fallidas} fallidas de ${total} total. (${totalTime}s)`);
  if (fallidas > 0) {
    console.log('Vuelve a ejecutar el script para reintentar las fallidas.');
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
