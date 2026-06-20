import { describe, it, expect } from 'vitest';
import { mapearCarta } from '../../../src/utils/scryfallMapper.js';

describe('scryfallMapper — mapearCarta()', () => {
  it('TC-SCR-001: carta regular con todos los campos', () => {
    const carta = {
      id: 'abc-123',
      name: 'Sol Ring',
      type_line: 'Artifact',
      mana_cost: '{1}',
      image_uris: { normal: 'https://img.scryfall.com/sol-ring.jpg' },
      set: 'cmd',
      set_name: 'Commander',
      released_at: '2020-01-01',
      collector_number: '217',
    };

    const result = mapearCarta(carta);

    expect(result.scryfall_id).toBe('abc-123');
    expect(result.nombre).toBe('Sol Ring');
    expect(result.tipo).toBe('Artifact');
    expect(result.costo_mana).toBe('{1}');
    expect(result.imagen_url).toBe('https://img.scryfall.com/sol-ring.jpg');
    expect(result.set_codigo).toBe('cmd');
    expect(result.set_nombre).toBe('Commander');
    expect(result.set_fecha_lanzamiento).toBe('2020-01-01');
    expect(result.numero_colector).toBe('217');
    expect(result.es_tierra_basica).toBe(false);
    expect(result.embedding).toBeNull();
  });

  it('TC-SCR-002: carta doble cara usa card_faces como fallback', () => {
    const carta = {
      id: 'dual-123',
      name: 'Delver of Secrets',
      card_faces: [
        { image_uris: { normal: 'https://img.scryfall.com/delver-front.jpg' } },
        { image_uris: { normal: 'https://img.scryfall.com/delver-back.jpg' } },
      ],
    };

    const result = mapearCarta(carta);
    expect(result.imagen_url).toBe('https://img.scryfall.com/delver-front.jpg');
  });

  it('TC-SCR-003: sin image_uris ni card_faces retorna imagen_url null', () => {
    const carta = { id: 'no-img', name: 'Mystery Card' };
    const result = mapearCarta(carta);
    expect(result.imagen_url).toBeNull();
  });

  it('TC-SCR-004: campos opcionales faltantes usan null', () => {
    const carta = { id: 'min-123', name: 'Minimal Card' };
    const result = mapearCarta(carta);

    expect(result.tipo).toBeNull();
    expect(result.costo_mana).toBeNull();
    expect(result.set_codigo).toBeNull();
    expect(result.set_nombre).toBeNull();
    expect(result.set_fecha_lanzamiento).toBeNull();
    expect(result.numero_colector).toBeNull();
  });

  it('TC-SCR-005: Basic Land se detecta como es_tierra_basica true', () => {
    const carta = { id: 'land-1', name: 'Forest', type_line: 'Basic Land — Forest' };
    const result = mapearCarta(carta);
    expect(result.es_tierra_basica).toBe(true);
  });

  it('TC-SCR-006: tierra no básica retorna es_tierra_basica false', () => {
    const carta = { id: 'land-2', name: 'Command Tower', type_line: 'Land' };
    const result = mapearCarta(carta);
    expect(result.es_tierra_basica).toBe(false);
  });

  it('TC-SCR-007: type_line null retorna es_tierra_basica false', () => {
    const carta = { id: 'no-type', name: 'Unknown' };
    const result = mapearCarta(carta);
    expect(result.es_tierra_basica).toBe(false);
  });

  it('TC-SCR-008: embedding siempre es null', () => {
    const carta = { id: 'emb-1', name: 'Test', embedding: [0.1, 0.2] };
    const result = mapearCarta(carta);
    expect(result.embedding).toBeNull();
  });
});
