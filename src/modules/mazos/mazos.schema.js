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

export const importarMazoSchema = z.object({
  lista: z.string().min(1),
  comandante: z.string().optional(),
});

export const actualizarMazoSchema = z.object({
  nombre: z.string().min(1).max(80).optional(),
  descripcion: z.string().optional().nullable(),
  publico: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe enviar al menos un campo para actualizar',
});