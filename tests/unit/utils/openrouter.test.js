import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import {
  generateEmbedding,
  generateEmbeddingsBatch,
  generarListaMazo,
  generateExplanation,
} from '../../../src/utils/openrouter.js';

function okResponse(body) {
  return { ok: true, status: 200, json: () => Promise.resolve(body), text: () => Promise.resolve('') };
}

function errorResponse(status) {
  return { ok: false, status, json: () => Promise.resolve({}), text: () => Promise.resolve('error body') };
}

describe('openrouter — Nomic embeddings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-OR-001: generateEmbedding retorna el primer embedding', async () => {
    fetchMock.mockResolvedValue(okResponse({ embeddings: [[0.1, 0.2, 0.3]] }));
    const result = await generateEmbedding('test text');
    expect(result).toEqual([0.1, 0.2, 0.3]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/embedding/text'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('TC-OR-002: generateEmbedding lanza error en respuesta no-OK', async () => {
    fetchMock.mockResolvedValue(errorResponse(500));
    await expect(generateEmbedding('test')).rejects.toThrow('Nomic embeddings error: 500');
  });

  it('TC-OR-003: generateEmbeddingsBatch retorna todos los embeddings', async () => {
    const embeddings = [[0.1], [0.2], [0.3]];
    fetchMock.mockResolvedValue(okResponse({ embeddings }));
    const result = await generateEmbeddingsBatch(['a', 'b', 'c']);
    expect(result).toEqual(embeddings);
  });

  it('TC-OR-004: generateEmbeddingsBatch lanza error en respuesta no-OK', async () => {
    fetchMock.mockResolvedValue(errorResponse(429));
    await expect(generateEmbeddingsBatch(['a'])).rejects.toThrow('Nomic embeddings error: 429');
  });
});

describe('openrouter — DeepSeek', () => {
  beforeEach(() => vi.clearAllMocks());

  const deepseekOk = (content) =>
    okResponse({ choices: [{ message: { content } }] });

  it('TC-OR-005: generarListaMazo formato COMMANDER incluye singleton', async () => {
    fetchMock.mockResolvedValue(deepseekOk('1 Sol Ring\n1 Command Tower'));
    const result = await generarListaMazo('Mi Mazo', 'COMMANDER', 'Atraxa', [], 10);
    expect(result).toContain('Sol Ring');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[1].content).toContain('singleton');
  });

  it('TC-OR-006: generarListaMazo formato STANDARD no incluye singleton', async () => {
    fetchMock.mockResolvedValue(deepseekOk('4 Lightning Bolt'));
    await generarListaMazo('Aggro', 'STANDARD', null, [], 5);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[1].content).not.toContain('singleton');
    expect(body.messages[1].content).toContain('STANDARD');
  });

  it('TC-OR-007: generarListaMazo con cartas existentes incluye contexto', async () => {
    fetchMock.mockResolvedValue(deepseekOk('1 Forest'));
    await generarListaMazo('Test', 'COMMANDER', null, ['Sol Ring', 'Island'], 3);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[1].content).toContain('Sol Ring');
    expect(body.messages[1].content).toContain('Island');
  });

  it('TC-OR-008: generarListaMazo con comandante lo incluye en el prompt', async () => {
    fetchMock.mockResolvedValue(deepseekOk('1 Forest'));
    await generarListaMazo('Test', 'COMMANDER', 'Atraxa', [], 5);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[1].content).toContain('Atraxa');
  });

  it('TC-OR-009: generateExplanation retorna el contenido del LLM', async () => {
    fetchMock.mockResolvedValue(deepseekOk('• Explicación de prueba'));
    const cartas = [{ nombre: 'Sol Ring', tipo: 'Artifact', texto: 'Tap: add 2' }];
    const result = await generateExplanation('Mi Mazo', 'COMMANDER', cartas);
    expect(result).toBe('• Explicación de prueba');
  });

  it('TC-OR-010: DeepSeek lanza error en respuesta no-OK', async () => {
    fetchMock.mockResolvedValue(errorResponse(503));
    await expect(
      generarListaMazo('Test', 'STANDARD', null, [], 5),
    ).rejects.toThrow('DeepSeek error: 503');
  });
});
