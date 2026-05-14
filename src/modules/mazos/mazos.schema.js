import { z } from 'zod';

const FORMATOS = ['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'];

export const crearMazoSchema = z.object({
  nombre: z.string().min(1),
  formato: z.enum(FORMATOS),
  descripcion: z.string().optional(),
  publico: z.coerce.boolean().default(false),
});

export const agregarCartaMazoSchema = z.object({
  scryfall_id: z.string().min(1),
  cantidad: z.number().int().positive(),
  es_comandante: z.boolean().default(false),
});

export const actualizarCartaMazoSchema = z.object({
  cantidad: z.number().int().positive().optional(),
  es_comandante: z.boolean().optional(),
});