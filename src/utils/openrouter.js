const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const NOMIC_BASE_URL = 'https://api-atlas.nomic.ai/v1';

function openrouterHeaders() {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function nomicHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOMIC_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function generateEmbedding(text) {
  const res = await fetch(`${NOMIC_BASE_URL}/embedding/text`, {
    method: 'POST',
    headers: nomicHeaders(),
    body: JSON.stringify({ model: 'nomic-embed-text-v1.5', texts: [text], task_type: 'search_document' }),
  });

  if (!res.ok) {
    throw new Error(`Nomic embeddings error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.embeddings[0];
}

export async function generateEmbeddingsBatch(texts) {
  const res = await fetch(`${NOMIC_BASE_URL}/embedding/text`, {
    method: 'POST',
    headers: nomicHeaders(),
    body: JSON.stringify({ model: 'nomic-embed-text-v1.5', texts, task_type: 'search_document' }),
  });

  if (!res.ok) {
    throw new Error(`Nomic embeddings error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.embeddings;
}

export async function generarListaMazo(nombre, formato, comandante, cartasExistentes, cantidadNecesaria) {
  const esCommander = formato === 'COMMANDER';

  const contexto = cartasExistentes.length > 0
    ? `\nCartas ya en el mazo:\n${cartasExistentes.map((n) => `- ${n}`).join('\n')}`
    : '';

  const instrucciones = esCommander
    ? `Genera exactamente ${cantidadNecesaria} cartas singleton para completar un mazo Commander (EDH). Todas en cantidad 1. Sigue los colores del comandante si se indica.`
    : `Genera exactamente ${cantidadNecesaria} cartas para completar un mazo de formato ${formato}. Puedes incluir hasta 4 copias de una misma carta (excepto tierras básicas).`;

  const contenido = `${instrucciones}
Mazo: "${nombre}"${comandante ? `\nComandante: ${comandante}` : ''}${contexto}

Responde SOLO con la lista, una carta por línea, en formato:
cantidad nombre_exacto_en_inglés

Ejemplo:
1 Sol Ring
1 Command Tower
4 Lightning Bolt

Sin encabezados, sin explicaciones, sin viñetas. Solo la lista.`;

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: openrouterHeaders(),
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en Magic: The Gathering. Generas listas de mazos usando nombres exactos de cartas en inglés, sin explicaciones adicionales.',
        },
        { role: 'user', content: contenido },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export async function generateExplanation(nombreMazo, formato, cartasRecomendadas) {
  const listaCartas = cartasRecomendadas
    .map((c) => `- ${c.nombre} (${c.tipo ?? 'Sin tipo'}): ${c.texto ?? ''}`)
    .join('\n');

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: openrouterHeaders(),
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto en Magic: The Gathering. Explica brevemente por qué estas cartas son buenas opciones para el mazo dado, en español, en 3-4 oraciones.',
        },
        {
          role: 'user',
          content: `Mazo: "${nombreMazo}" (formato ${formato})\n\nCartas recomendadas:\n${listaCartas}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter chat error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
