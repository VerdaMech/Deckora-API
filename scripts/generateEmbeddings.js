import 'dotenv/config';
import sequelize from '../src/config/db.js';
import { generateEmbedding, generateEmbeddingsBatch } from '../src/utils/openrouter.js';
import pLimit from 'p-limit';
import { QueryTypes } from 'sequelize';

const BATCH_SIZE = 50;         // cartas por llamada a la API
const CONCURRENCIA = 2;        // batches simultáneos (= 100 cartas en vuelo)
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

async function guardarEmbedding(cartaId, embedding) {
  const embeddingStr = `[${embedding.join(',')}]`;
  await sequelize.query('UPDATE cartas SET embedding = $1::vector WHERE id = $2', {
    bind: [embeddingStr, cartaId],
    type: QueryTypes.UPDATE,
  });
}

async function procesarBatch(cartas) {
  const textos = cartas.map(buildTexto);
  const etiqueta = `batch [${cartas[0].id.slice(0, 8)}…]`;

  let embeddings;
  try {
    embeddings = await withRetry(() => generateEmbeddingsBatch(textos), etiqueta);
  } catch (err) {
    // si el batch falla definitivamente, reintenta carta por carta
    console.warn(`${etiqueta} agotó reintentos. Procesando carta por carta...`);
    let ok = 0;
    let fail = 0;
    for (const carta of cartas) {
      try {
        const emb = await withRetry(
          () => generateEmbedding(buildTexto(carta)),
          `carta ${carta.id.slice(0, 8)}`,
        );
        await guardarEmbedding(carta.id, emb);
        ok++;
      } catch (e) {
        console.error(`[carta ${carta.id}] falló definitivamente: ${e.message}`);
        fail++;
      }
    }
    return { ok, fail };
  }

  const resultados = await Promise.allSettled(
    cartas.map((carta, i) => guardarEmbedding(carta.id, embeddings[i])),
  );

  const ok = resultados.filter((r) => r.status === 'fulfilled').length;
  const fail = resultados.filter((r) => r.status === 'rejected').length;
  return { ok, fail };
}

async function main() {
  const cartas = await sequelize.query(
    'SELECT id, tipo, cmc, colors FROM cartas WHERE embedding IS NULL',
    { type: QueryTypes.SELECT },
  );

  const total = cartas.length;
  console.log(`Cartas sin embedding: ${total}`);

  if (total === 0) {
    console.log('Nada que procesar.');
    await sequelize.close();
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

  const tareas = batches.map((batch) =>
    limit(async () => {
      const { ok, fail } = await procesarBatch(batch);
      procesadas += ok;
      fallidas += fail;
      batchesCompletados++;

      if (batchesCompletados % 5 === 0 || batchesCompletados === batches.length) {
        console.log(
          `Progreso: ${procesadas + fallidas}/${total} cartas — batch ${batchesCompletados}/${batches.length}`,
        );
      }
    }),
  );

  await Promise.all(tareas);

  console.log(`\nFinalizado: ${procesadas} exitosas, ${fallidas} fallidas de ${total} total.`);
  if (fallidas > 0) {
    console.log('Vuelve a ejecutar el script para reintentar las fallidas.');
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
