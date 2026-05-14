import 'dotenv/config';
import sequelize from '../src/config/db.js';
import { generateEmbedding } from '../src/utils/openrouter.js';
import pLimit from 'p-limit';
import { QueryTypes } from 'sequelize';

const CONCURRENCIA = 3;
const MAX_REINTENTOS = 5;
const DELAY_BASE_MS = 1000;

const limit = pLimit(CONCURRENCIA);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generarEmbeddingConRetry(texto, cartaId) {
  for (let intento = 1; intento <= MAX_REINTENTOS; intento++) {
    try {
      return await generateEmbedding(texto);
    } catch (err) {
      const es429 = err.message.includes('429');
      const esUltimoIntento = intento === MAX_REINTENTOS;

      if (esUltimoIntento) throw err;

      const espera = es429
        ? DELAY_BASE_MS * 2 ** intento      // backoff exponencial: 2s, 4s, 8s, 16s
        : DELAY_BASE_MS;

      console.warn(
        `[carta ${cartaId}] intento ${intento}/${MAX_REINTENTOS} falló (${err.message.slice(0, 60)}). Reintentando en ${espera / 1000}s...`,
      );
      await sleep(espera);
    }
  }
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

  let procesadas = 0;
  let fallidas = 0;

  const tareas = cartas.map((carta) =>
    limit(async () => {
      const texto = `${carta.tipo ?? ''} CMC:${carta.cmc ?? 0} Colors:${carta.colors?.join(',') ?? 'none'}`;

      try {
        const embedding = await generarEmbeddingConRetry(texto, carta.id);
        const embeddingStr = `[${embedding.join(',')}]`;

        await sequelize.query('UPDATE cartas SET embedding = $1::vector WHERE id = $2', {
          bind: [embeddingStr, carta.id],
          type: QueryTypes.UPDATE,
        });

        procesadas++;
      } catch (err) {
        console.error(`[carta ${carta.id}] falló definitivamente: ${err.message}`);
        fallidas++;
      }

      const completadas = procesadas + fallidas;
      if (completadas % 100 === 0) {
        console.log(`Progreso: ${completadas}/${total} (${procesadas} ok, ${fallidas} fallidas)`);
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
