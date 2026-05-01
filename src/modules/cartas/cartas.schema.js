import { z } from 'zod';

export const buscarQuerySchema = z.object({
  q: z.string().min(1),
});

export const listarQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
