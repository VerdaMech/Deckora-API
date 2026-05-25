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
import { Pool } from 'pg';

const SCRYFALL_BULK_URL = 'https://api.scryfall.com/bulk-data';

// ─────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────
const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : null;
const COMMANDER_ONLY = args.includes('--commander');
const DEBUG = args.includes('--debug');

const BATCH_SIZE = 500;   // cartas por query multi-row
const PARALLEL = 5;       // batches en paralelo

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
    try { body = await res.text(); } catch { /* ignorado */ }
    throw new Error(
      `HTTP ${res.status} ${res.statusText} en ${url}\n  Cuerpo: ${body.slice(0, 500)}`
    );
  }

  const json = await res.json();
  if (DEBUG) {
    console.log('  [debug] keys de la respuesta:', Object.keys(json));
    if (Array.isArray(json)) console.log(`  [debug] array de ${json.length} elementos`);
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
    set_nombre: card.set_name ?? null,
    set_fecha_lanzamiento: card.released_at ?? null,
    numero_colector: card.collector_number ?? null,
    es_tierra_basica: isBasic,
    cmc: Math.round(card.cmc ?? 0),
    colors: card.colors?.length > 0 ? card.colors : (card.color_identity ?? []),
    legalities: card.legalities ?? {},
  };
}

function shouldIncludeCard(card) {
  if (card.lang !== 'en') return false;
  if (card.digital) return false;
  const imagenNormal =
    card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null;
  if (!imagenNormal) return false;

  if (COMMANDER_ONLY) {
    const legality = card.legalities?.commander;
    if (legality === 'banned' || legality === 'not_legal') return false;
  } else {
    const legalities = card.legalities ?? {};
    const formatos = ['commander', 'standard', 'modern', 'pioneer', 'legacy'];
    const legalEnAlguno = formatos.some(
      (f) => legalities[f] === 'legal' || legalities[f] === 'restricted',
    );
    if (!legalEnAlguno) return false;
  }

  return true;
}

// Construye un INSERT multi-row para un array de cartas ya mapeadas.
// Devuelve { text, values }.
function buildBatchInsert(cartas) {
  const FIELDS = 16;
  const rows = [];
  const values = [];

  cartas.forEach((c, i) => {
    const base = i * FIELDS;
    rows.push(
      `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},` +
      `$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},` +
      `$${base + 11},$${base + 12},$${base + 13},$${base + 14},$${base + 15},$${base + 16}::jsonb)`
    );
    values.push(
      c.scryfall_id, c.nombre, c.tipo, c.resistencia, c.fuerza,
      c.texto, c.costo_mana, c.imagen_url, c.set_codigo, c.set_nombre,
      c.set_fecha_lanzamiento, c.numero_colector, c.es_tierra_basica,
      c.cmc, c.colors, JSON.stringify(c.legalities),
    );
  });

  const text = `
    INSERT INTO cartas (
      scryfall_id, nombre, tipo, resistencia, fuerza,
      texto, costo_mana, imagen_url, set_codigo, set_nombre,
      set_fecha_lanzamiento, numero_colector, es_tierra_basica,
      cmc, colors, legalities
    ) VALUES ${rows.join(',')}
    ON CONFLICT (scryfall_id) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      tipo = EXCLUDED.tipo,
      resistencia = EXCLUDED.resistencia,
      fuerza = EXCLUDED.fuerza,
      texto = EXCLUDED.texto,
      costo_mana = EXCLUDED.costo_mana,
      imagen_url = EXCLUDED.imagen_url,
      set_codigo = EXCLUDED.set_codigo,
      set_nombre = EXCLUDED.set_nombre,
      set_fecha_lanzamiento = EXCLUDED.set_fecha_lanzamiento,
      numero_colector = EXCLUDED.numero_colector,
      es_tierra_basica = EXCLUDED.es_tierra_basica,
      cmc = EXCLUDED.cmc,
      colors = EXCLUDED.colors,
      legalities = EXCLUDED.legalities
  `;

  return { text, values };
}

// Inserta un batch usando un cliente del pool.
// Si el INSERT multi-row falla, reintenta carta por carta.
async function insertBatch(pool, cartas) {
  let inserted = 0;
  let failed = 0;
  const failedNames = [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    try {
      const { text, values } = buildBatchInsert(cartas);
      await client.query(text, values);
      inserted = cartas.length;
      await client.query('COMMIT');
    } catch (batchErr) {
      await client.query('ROLLBACK');

      // Fallback: insertar carta por carta
      await client.query('BEGIN');
      for (const c of cartas) {
        try {
          await client.query(
            `INSERT INTO cartas (
               scryfall_id, nombre, tipo, resistencia, fuerza,
               texto, costo_mana, imagen_url, set_codigo, set_nombre,
               set_fecha_lanzamiento, numero_colector, es_tierra_basica,
               cmc, colors, legalities
             )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb)
             ON CONFLICT (scryfall_id) DO UPDATE SET
               nombre = EXCLUDED.nombre,
               tipo = EXCLUDED.tipo,
               resistencia = EXCLUDED.resistencia,
               fuerza = EXCLUDED.fuerza,
               texto = EXCLUDED.texto,
               costo_mana = EXCLUDED.costo_mana,
               imagen_url = EXCLUDED.imagen_url,
               set_codigo = EXCLUDED.set_codigo,
               set_nombre = EXCLUDED.set_nombre,
               set_fecha_lanzamiento = EXCLUDED.set_fecha_lanzamiento,
               numero_colector = EXCLUDED.numero_colector,
               es_tierra_basica = EXCLUDED.es_tierra_basica,
               cmc = EXCLUDED.cmc,
               colors = EXCLUDED.colors,
               legalities = EXCLUDED.legalities`,
            [
              c.scryfall_id, c.nombre, c.tipo, c.resistencia, c.fuerza,
              c.texto, c.costo_mana, c.imagen_url, c.set_codigo, c.set_nombre,
              c.set_fecha_lanzamiento, c.numero_colector, c.es_tierra_basica,
              c.cmc, c.colors, JSON.stringify(c.legalities),
            ]
          );
          inserted++;
        } catch {
          failed++;
          failedNames.push(c.nombre);
        }
      }
      await client.query('COMMIT');
    }
  } finally {
    client.release();
  }

  return { inserted, failed, failedNames };
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
  console.log(`  Batch: ${BATCH_SIZE} cartas | Paralelismo: ${PARALLEL} conexiones`);
  console.log('');

  // 1. Manifest de bulk data
  console.log('→ Consultando manifest de Scryfall...');
  const manifest = await fetchJson(SCRYFALL_BULK_URL);

  if (!manifest || !Array.isArray(manifest.data)) {
    console.error('✗ La respuesta de Scryfall no tiene el formato esperado.');
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

  // 3. Filtrar y mapear
  const filtered = cards.filter(shouldIncludeCard).map(mapCard);
  console.log(`  ${filtered.length.toLocaleString()} cartas tras filtros`);

  const target = LIMIT ? filtered.slice(0, LIMIT) : filtered;
  console.log(`  ${target.length.toLocaleString()} cartas se van a insertar`);
  console.log('');

  // 4. Pool de conexiones
  console.log('→ Conectando al pool de base de datos...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: PARALLEL,
  });

  // Verificar conexión
  const testClient = await pool.connect();
  testClient.release();
  console.log('  Conectado.');
  console.log('');

  // 5. Insertar en batches paralelos
  console.log('→ Insertando...');
  const startedAt = Date.now();
  let totalInserted = 0;
  let totalFailed = 0;
  const allFailedNames = [];

  // Dividir en batches
  const batches = [];
  for (let i = 0; i < target.length; i += BATCH_SIZE) {
    batches.push(target.slice(i, i + BATCH_SIZE));
  }

  // Procesar batches en grupos de PARALLEL
  for (let i = 0; i < batches.length; i += PARALLEL) {
    const grupo = batches.slice(i, i + PARALLEL);
    const resultados = await Promise.all(
      grupo.map((batch) => insertBatch(pool, batch))
    );

    for (const r of resultados) {
      totalInserted += r.inserted;
      totalFailed += r.failed;
      allFailedNames.push(...r.failedNames);
    }

    const pct = ((totalInserted / target.length) * 100).toFixed(1);
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
    process.stdout.write(
      `\r  ${totalInserted.toLocaleString()}/${target.length.toLocaleString()} (${pct}%) — ${elapsed}s`
    );
  }
  console.log('');

  await pool.end();

  const totalTime = ((Date.now() - startedAt) / 1000).toFixed(0);
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`  ✓ Listo. Insertadas/actualizadas: ${totalInserted.toLocaleString()}`);
  if (totalFailed > 0) {
    console.log(`  ⚠ Fallidas: ${totalFailed}`);
    if (allFailedNames.length > 0) {
      console.log(`  Primeras fallidas: ${allFailedNames.slice(0, 5).join(', ')}`);
    }
  }
  console.log(`  Tiempo total: ${totalTime}s`);
  console.log('═══════════════════════════════════════════');
}

main().catch((err) => {
  console.error('');
  console.error('✗ Error fatal:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
