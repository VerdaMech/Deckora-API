import 'dotenv/config';
import sequelize from '../src/config/db.js';
import { generateEmbedding } from '../src/utils/openrouter.js';
import pLimit from 'p-limit';
import { QueryTypes } from 'sequelize';

const limit = pLimit(5);

async function main() {
  const cartas = await sequelize.query(
    'SELECT id, tipo, cmc, colors FROM cartas WHERE embedding IS NULL',
    { type: QueryTypes.SELECT },
  );

  const total = cartas.length;
  console.log(`Cartas sin embedding: ${total}`);

  let procesadas = 0;
  let fallidas = 0;

  const tareas = cartas.map((carta) =>
    limit(async () => {
      const texto = `${carta.tipo ?? ''} CMC:${carta.cmc ?? 0} Colors:${carta.colors?.join(',') ?? 'none'}`;

      try {
        const embedding = await generateEmbedding(texto);
        const embeddingStr = `[${embedding.join(',')}]`;

        await sequelize.query('UPDATE cartas SET embedding = $1::vector WHERE id = $2', {
          bind: [embeddingStr, carta.id],
          type: QueryTypes.UPDATE,
        });

        procesadas++;
      } catch (err) {
        console.error(`Error en carta ${carta.id}: ${err.message}`);
        fallidas++;
      }

      if ((procesadas + fallidas) % 100 === 0) {
        console.log(`Procesadas ${procesadas + fallidas}/${total}`);
      }
    }),
  );

  await Promise.all(tareas);

  console.log(`\nResultado: ${procesadas} exitosas, ${fallidas} fallidas de ${total} total.`);
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
