import { z } from 'zod';

const booleanQueryParam = z
  .string()
  .optional()
  .transform((v) => v === 'true')
  .pipe(z.boolean())
  .default(false);

export const listarCartasSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 50))
    .pipe(z.number().int().min(1).max(50)),
  set_codigo: z.string().max(10).optional(),
  incluir_tokens: booleanQueryParam,
  incluir_arte: booleanQueryParam,
  formato: z.enum(['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY']).optional(),
});
