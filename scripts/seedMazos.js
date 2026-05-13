// scripts/seedMazos.js
//
// Crea 4 jugadores de prueba, cada uno con 1 mazo por formato (5 formatos).
// Total: 4 jugadores × 5 mazos = 20 mazos, todos con el mismo pool de cartas.
//
// Uso:
//   node scripts/seedMazos.js           -> crea jugadores + mazos
//   node scripts/seedMazos.js --clean   -> elimina solo los datos creados por este script
//
// Requisitos:
//   - DATABASE_URL en .env
//   - La tabla cartas debe tener datos (ejecutar seedCartas.js primero)

import 'dotenv/config';
import { Client } from 'pg';
import { randomUUID } from 'crypto';

// ─────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────
const FORMATS = ['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'];

const CARDS_PER_FORMAT = {
  COMMANDER: 100,
  STANDARD: 60,
  MODERN: 60,
  PIONEER: 60,
  LEGACY: 60,
};

const TEST_PLAYERS = [
  { nombre_usuario: 'seed_jugador1', correo: 'jugador1@seed.deckora' },
  { nombre_usuario: 'seed_jugador2', correo: 'jugador2@seed.deckora' },
  { nombre_usuario: 'seed_jugador3', correo: 'jugador3@seed.deckora' },
  { nombre_usuario: 'seed_jugador4', correo: 'jugador4@seed.deckora' },
];

// ─────────────────────────────────────────────
// Modo --clean
// ─────────────────────────────────────────────
async function clean(client) {
  console.log('→ Eliminando datos de seed...');

  const correos = TEST_PLAYERS.map((p) => `'${p.correo}'`).join(', ');

  // Los mazos y mazo_cartas se borran en cascada al borrar jugadores/usuarios
  await client.query(`
    DELETE FROM usuarios WHERE correo IN (${correos})
  `);

  console.log('  ✓ Jugadores, mazos y mazo_cartas eliminados.');
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  const isClean = process.argv.includes('--clean');

  console.log('═══════════════════════════════════════════');
  console.log('  Deckora — Seeder de mazos (prueba)');
  console.log('═══════════════════════════════════════════');
  console.log('');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('→ Conectado a la base de datos.');

  if (isClean) {
    await clean(client);
    await client.end();
    return;
  }

  // 1. Obtener pool de cartas
  console.log('→ Leyendo cartas desde la BD...');
  const maxNeeded = Math.max(...Object.values(CARDS_PER_FORMAT));
  const { rows: cartas } = await client.query(
    `SELECT id FROM cartas LIMIT $1`,
    [maxNeeded]
  );

  if (cartas.length < maxNeeded) {
    throw new Error(
      `Se necesitan al menos ${maxNeeded} cartas en la BD. ` +
      `Encontradas: ${cartas.length}. Ejecuta seedCartas.js primero.`
    );
  }

  const cardPool = cartas.map((c) => c.id);
  console.log(`  ${cardPool.length} cartas disponibles.`);
  console.log('');

  // 2. Crear usuarios y jugadores
  console.log('→ Creando jugadores de prueba...');
  const jugadorIds = [];

  for (const player of TEST_PLAYERS) {
    // Upsert usuario (idempotente por correo)
    await client.query(
      `INSERT INTO usuarios (id, nombre_usuario, correo, rol, activo)
       VALUES ($1, $2, $3, 'jugador', true)
       ON CONFLICT (correo) DO UPDATE SET nombre_usuario = EXCLUDED.nombre_usuario`,
      [randomUUID(), player.nombre_usuario, player.correo]
    );

    const { rows } = await client.query(
      `SELECT id FROM usuarios WHERE correo = $1`,
      [player.correo]
    );
    const userId = rows[0].id;

    // Upsert jugador
    await client.query(
      `INSERT INTO jugadores (usuario_id, formato_preferido)
       VALUES ($1, 'COMMANDER')
       ON CONFLICT (usuario_id) DO NOTHING`,
      [userId]
    );

    jugadorIds.push({ userId, nombre: player.nombre_usuario });
    console.log(`  ✓ ${player.nombre_usuario} → ${userId}`);
  }
  console.log('');

  // 3. Crear mazos y mazo_cartas
  console.log('→ Creando mazos...');
  let totalMazos = 0;
  let totalCartas = 0;

  for (const { userId, nombre } of jugadorIds) {
    for (const formato of FORMATS) {
      const slug = `seed-${formato.toLowerCase()}-${nombre}`;
      const mazoNombre = `[SEED] ${formato} - ${nombre}`;
      const numCartas = CARDS_PER_FORMAT[formato];
      const mazoCards = cardPool.slice(0, numCartas);

      // Upsert mazo (idempotente por slug)
      await client.query(
        `INSERT INTO mazos (id, usuario_id, nombre, formato, publico, slug)
         VALUES ($1, $2, $3, $4, false, $5)
         ON CONFLICT (slug) DO NOTHING`,
        [randomUUID(), userId, mazoNombre, formato, slug]
      );

      const { rows: mazoRows } = await client.query(
        `SELECT id FROM mazos WHERE slug = $1`,
        [slug]
      );
      const mazoId = mazoRows[0].id;

      // Insertar mazo_cartas en lote
      await client.query('BEGIN');
      for (let i = 0; i < mazoCards.length; i++) {
        const esComandante = formato === 'COMMANDER' && i === 0;
        await client.query(
          `INSERT INTO mazo_cartas (id, mazo_id, carta_id, cantidad, es_comandante)
           VALUES ($1, $2, $3, 1, $4)
           ON CONFLICT (mazo_id, carta_id) DO NOTHING`,
          [randomUUID(), mazoId, mazoCards[i], esComandante]
        );
      }
      await client.query('COMMIT');

      totalMazos++;
      totalCartas += mazoCards.length;
      console.log(`  ✓ ${nombre} → ${formato} (${mazoCards.length} cartas)`);
    }
  }

  await client.end();

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`  ✓ Listo.`);
  console.log(`  Jugadores: ${jugadorIds.length}`);
  console.log(`  Mazos:     ${totalMazos} (${FORMATS.length} por jugador)`);
  console.log(`  Entradas en mazo_cartas: ${totalCartas}`);
  console.log('');
  console.log('  Para limpiar: node scripts/seedMazos.js --clean');
  console.log('═══════════════════════════════════════════');
}

main().catch((err) => {
  console.error('');
  console.error('✗ Error fatal:', err.message);
  process.exit(1);
});
