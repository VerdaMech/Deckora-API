const BASE_URL = 'https://openrouter.ai/api/v1';

function headers() {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function generateEmbedding(text) {
  const res = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ model: 'nomic-ai/nomic-embed-text-v1.5', input: text }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter embeddings error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

export async function generateExplanation(nombreMazo, formato, cartasRecomendadas) {
  const listaCartas = cartasRecomendadas
    .map((c) => `- ${c.nombre} (${c.tipo ?? 'Sin tipo'}): ${c.texto ?? ''}`)
    .join('\n');

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: headers(),
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
