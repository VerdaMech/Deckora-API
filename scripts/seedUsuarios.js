// scripts/seedUsuarios.js
//
// Crea 4 jugadores de prueba en Supabase Auth + public.usuarios + jugadores + estadisticas.
// Replica exactamente el flujo de signup real, sin requerir confirmación de email.
//
// Uso:
//   node scripts/seedUsuarios.js           -> crea los 4 jugadores
//   node scripts/seedUsuarios.js --clean   -> elimina los 4 jugadores de Auth y la BD
//
// Requisitos:
//   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y DATABASE_URL en .env

import 'dotenv/config';
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

const PASSWORD = 'Test1234!';

const TEST_PLAYERS = [
  { nombre_usuario: 'seed_jugador1', correo: 'jugador1@seed.deckora' },
  { nombre_usuario: 'seed_jugador2', correo: 'jugador2@seed.deckora' },
  { nombre_usuario: 'seed_jugador3', correo: 'jugador3@seed.deckora' },
  { nombre_usuario: 'seed_jugador4', correo: 'jugador4@seed.deckora' },
];

function adminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function clean(supabase, db) {
  console.log('→ Eliminando jugadores de seed...');

  for (const player of TEST_PLAYERS) {
    // Buscar el usuario en Auth por email
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw new Error(`Error listando usuarios: ${error.message}`);

    const authUser = data.users.find((u) => u.email === player.correo);
    if (authUser) {
      const { error: delError } = await supabase.auth.admin.deleteUser(authUser.id);
      if (delError) {
        console.warn(`  ⚠ No se pudo borrar ${player.correo} de Auth: ${delError.message}`);
      } else {
        console.log(`  ✓ ${player.correo} eliminado de Supabase Auth`);
      }
    } else {
      console.log(`  - ${player.correo} no estaba en Auth`);
    }
  }

  // Las filas en public.usuarios, jugadores y estadisticas se borran en cascada
  const correos = TEST_PLAYERS.map((p) => `'${p.correo}'`).join(', ');
  await db.query(`DELETE FROM usuarios WHERE correo IN (${correos})`);
  console.log('  ✓ Filas eliminadas de public.usuarios (jugadores y estadisticas en cascada)');
}

async function main() {
  const isClean = process.argv.includes('--clean');

  console.log('═══════════════════════════════════════════');
  console.log('  Deckora — Seeder de usuarios jugadores');
  console.log('═══════════════════════════════════════════');
  console.log('');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el .env');
  }

  const supabase = adminClient();

  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await db.connect();
  console.log('→ Conectado a la base de datos.');

  if (isClean) {
    await clean(supabase, db);
    await db.end();
    return;
  }

  console.log(`→ Creando 4 jugadores (contraseña: ${PASSWORD})...\n`);

  for (const player of TEST_PLAYERS) {
    // 1. Crear en Supabase Auth (sin email de confirmación)
    const { data, error } = await supabase.auth.admin.createUser({
      email: player.correo,
      password: PASSWORD,
      email_confirm: true,
    });

    if (error) {
      if (error.message.toLowerCase().includes('already been registered') ||
          error.message.toLowerCase().includes('already exists')) {
        console.log(`  ~ ${player.nombre_usuario} ya existe en Auth, continuando...`);
      } else {
        throw new Error(`Error creando ${player.correo} en Auth: ${error.message}`);
      }
    }

    // Obtener el UUID (ya sea recién creado o existente)
    let userId = data?.user?.id;
    if (!userId) {
      const { data: list } = await supabase.auth.admin.listUsers();
      userId = list.users.find((u) => u.email === player.correo)?.id;
    }
    if (!userId) throw new Error(`No se pudo obtener el id de ${player.correo}`);

    // 2. Insertar en public.usuarios (idempotente)
    await db.query(
      `INSERT INTO usuarios (id, nombre_usuario, correo, rol, activo)
       VALUES ($1, $2, $3, 'jugador', true)
       ON CONFLICT (correo) DO UPDATE SET nombre_usuario = EXCLUDED.nombre_usuario`,
      [userId, player.nombre_usuario, player.correo]
    );

    // 3. Insertar en jugadores (idempotente)
    await db.query(
      `INSERT INTO jugadores (usuario_id, formato_preferido)
       VALUES ($1, 'COMMANDER')
       ON CONFLICT (usuario_id) DO NOTHING`,
      [userId]
    );

    // 4. Insertar en estadisticas (idempotente)
    await db.query(
      `INSERT INTO estadisticas (usuario_id, partidas_ganadas, partidas_perdidas, partidas_empatadas, torneos_participados)
       VALUES ($1, 0, 0, 0, 0)
       ON CONFLICT (usuario_id) DO NOTHING`,
      [userId]
    );

    console.log(`  ✓ ${player.nombre_usuario} | ${player.correo} | ${userId}`);
  }

  await db.end();

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  ✓ Listo. Podés iniciar sesión con:');
  console.log(`  Correo: jugador1@seed.deckora  ...  jugador4@seed.deckora`);
  console.log(`  Contraseña: ${PASSWORD}`);
  console.log('');
  console.log('  Para limpiar: node scripts/seedUsuarios.js --clean');
  console.log('═══════════════════════════════════════════');
}

main().catch((err) => {
  console.error('');
  console.error('✗ Error fatal:', err.message);
  process.exit(1);
});
