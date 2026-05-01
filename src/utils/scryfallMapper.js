export function mapearCarta(c) {
  const imagen_url =
    c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? null;

  return {
    scryfall_id: c.id,
    nombre: c.name,
    tipo: c.type_line ?? null,
    costo_mana: c.mana_cost ?? null,
    imagen_url,
    set_codigo: c.set ?? null,
    es_tierra_basica: c.type_line?.includes('Basic Land') ?? false,
    embedding: null,
  };
}
