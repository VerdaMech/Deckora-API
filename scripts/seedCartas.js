// scripts/seedCartas.js
//
// Seeder de cartas de Magic desde el bulk data de Scryfall.
//
// Uso (desde la raíz del repo backend):
//   node scripts/seedCartas.js                  -> seed completo
//   node scripts/seedCartas.js --limit 500      -> solo 500 cartas (prueba)
//   node scripts/seedCartas.js --commander      -> solo cartas legales en commander
//   node scripts/seedCartas.js --debug          -> log extra de la respuesta de Scryfall
//
// Requisitos:
//   - Node 18+ (usa fetch nativo).
//   - DATABASE_URL en .env apuntando a la BD de Supabase.
//   - npm install pg dotenv

import 'dotenv/config';
import { Client } from 'pg';

const SCRYFALL_BULK_URL = 'https://api.scryfall.com/bulk-data';

// ─────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────
const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : null;
const COMMANDER_ONLY = args.includes('--commander');
const DEBUG = args.includes('--debug');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'deckora-seeder/1.0 (academic project)',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    let body = '';
    try {
      body = await res.text();
    } catch {
      // ignorado
    }
    throw new Error(
      `HTTP ${res.status} ${res.statusText} en ${url}\n  Cuerpo: ${body.slice(0, 500)}`
    );
  }

  const json = await res.json();
  if (DEBUG) {
    console.log('  [debug] keys de la respuesta:', Object.keys(json));
    if (Array.isArray(json)) {
      console.log(`  [debug] array de ${json.length} elementos`);
    }
  }
  return json;
}

function pickField(card, fieldName) {
  return card[fieldName] ?? card.card_faces?.[0]?.[fieldName] ?? null;
}

function mapCard(card) {
  const isBasic = card.type_line?.includes('Basic Land') ?? false;
  const imageUrl =
    card.image_uris?.normal ??
    card.card_faces?.[0]?.image_uris?.normal ??
    null;

  let oracleText = card.oracle_text;
  if (!oracleText && card.card_faces) {
    oracleText = card.card_faces
      .map((f) => f.oracle_text)
      .filter(Boolean)
      .join('\n//\n');
  }

  return {
    scryfall_id: card.id,
    nombre: card.name,
    tipo: card.type_line ?? null,
    resistencia: pickField(card, 'toughness'),
    fuerza: pickField(card, 'power'),
    texto: oracleText ?? null,
    costo_mana: pickField(card, 'mana_cost') ?? '',
    imagen_url: imageUrl,
    set_codigo: card.set ?? null,
    es_tierra_basica: isBasic,
  };
}

function shouldIncludeCard(card) {
  if (card.lang !== 'en') return false;
  if (card.digital) return false;
  if (!card.image_uris && !card.card_faces?.[0]?.image_uris) return false;

  if (COMMANDER_ONLY) {
    const legality = card.legalities?.commander;
    if (legality === 'banned' || legality === 'not_legal') return false;
  } else {
    if (card.legalities?.commander === 'banned') return false;
  }

  return true;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Deckora — Seeder de cartas (Scryfall)');
  console.log('═══════════════════════════════════════════');
  if (LIMIT) console.log(`  Modo: prueba (límite ${LIMIT})`);
  if (COMMANDER_ONLY) console.log('  Filtro: solo cartas legales en Commander');
  if (DEBUG) console.log('  Modo debug: ON');
  console.log('');

  // 1. Manifest de bulk data
  console.log('→ Consultando manifest de Scryfall...');
  const manifest = await fetchJson(SCRYFALL_BULK_URL);

  if (!manifest || !Array.isArray(manifest.data)) {
    console.error('');
    console.error('✗ La respuesta de Scryfall no tiene el formato esperado.');
    console.error('  Recibí:', JSON.stringify(manifest, null, 2).slice(0, 1000));
    throw new Error('Respuesta inesperada de Scryfall (no hay manifest.data)');
  }

  const oracle = manifest.data.find((d) => d.type === 'oracle_cards');
  if (!oracle) {
    throw new Error(
      `No se encontró oracle_cards. Tipos disponibles: ${manifest.data.map((d) => d.type).join(', ')}`
    );
  }
  console.log(`  Oracle cards: ${(oracle.size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Última actualización: ${oracle.updated_at}`);

  // 2. Descargar oracle_cards
  console.log('→ Descargando catálogo (puede tardar 1-2 min)...');
  const cards = await fetchJson(oracle.download_uri);

  if (!Array.isArray(cards)) {
    throw new Error('El download_uri no devolvió un array de cartas');
  }
  console.log(`  ${cards.length.toLocaleString()} cartas en el catálogo crudo`);

  // 3. Filtrar
  const filtered = cards.filter(shouldIncludeCard);
  console.log(`  ${filtered.length.toLocaleString()} cartas tras filtros`);

  const target = LIMIT ? filtered.slice(0, LIMIT) : filtered;
  console.log(`  ${target.length.toLocaleString()} cartas se van a insertar`);
  console.log('');

  // 4. Conexión a la base
  console.log('→ Conectando a la base de datos...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('  Conectado.');
  console.log('');

  // 5. Insertar en lotes con transacciones
  console.log('→ Insertando...');
  const startedAt = Date.now();
  let inserted = 0;
  let failed = 0;
  const BATCH = 200;

  for (let i = 0; i < target.length; i += BATCH) {
    const slice = target.slice(i, i + BATCH);

    await client.query('BEGIN');
    for (const raw of slice) {
      const c = mapCard(raw);
      try {
        await client.query(
          `INSERT INTO cartas (
             scryfall_id, nombre, tipo, resistencia, fuerza,
             texto, costo_mana, imagen_url, set_codigo, es_tierra_basica
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (scryfall_id) DO UPDATE SET
             nombre = EXCLUDED.nombre,
             tipo = EXCLUDED.tipo,
             resistencia = EXCLUDED.resistencia,
             fuerza = EXCLUDED.fuerza,
             texto = EXCLUDED.texto,
             costo_mana = EXCLUDED.costo_mana,
             imagen_url = EXCLUDED.imagen_url,
             set_codigo = EXCLUDED.set_codigo,
             es_tierra_basica = EXCLUDED.es_tierra_basica`,
          [
            c.scryfall_id,
            c.nombre,
            c.tipo,
            c.resistencia,
            c.fuerza,
            c.texto,
            c.costo_mana,
            c.imagen_url,
            c.set_codigo,
            c.es_tierra_basica,
          ]
        );
        inserted++;
      } catch (err) {
        failed++;
        if (failed < 5) {
          console.error(`\n  ✗ Falló ${c.nombre}: ${err.message}`);
        }
      }
    }
    await client.query('COMMIT');

    const pct = ((inserted / target.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
    process.stdout.write(
      `\r  ${inserted.toLocaleString()}/${target.length.toLocaleString()} (${pct}%) — ${elapsed}s`
    );
  }
  console.log('');

  await client.end();

  const totalTime = ((Date.now() - startedAt) / 1000).toFixed(0);
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`  ✓ Listo. Insertadas/actualizadas: ${inserted.toLocaleString()}`);
  if (failed > 0) console.log(`  ⚠ Fallidas: ${failed}`);
  console.log(`  Tiempo total: ${totalTime}s`);
  console.log('═══════════════════════════════════════════');
}

main().catch((err) => {
  console.error('');
  console.error('✗ Error fatal:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});