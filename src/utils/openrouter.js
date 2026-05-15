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
