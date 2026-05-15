import { z } from 'zod';

export const crearRondaSchema = z.object({
  tipo_ronda: z.enum(['swiss', 'eliminacion_directa', 'final']),
  asignaciones: z
    .array(
      z.object({
        inscripcion_ids: z.array(z.string().uuid()).min(2).max(4),
      })
    )
    .optional(),
});
