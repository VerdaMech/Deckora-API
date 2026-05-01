import { z } from 'zod';

export const agregarCartaSchema = z.object({
  scryfall_id: z.string().min(1),
  cantidad: z.number().int().positive(),
  es_foil: z.boolean().default(false),
});

export const actualizarCantidadSchema = z.object({
  cantidad: z.number().int().positive(),
  es_foil: z.boolean().default(false),
});