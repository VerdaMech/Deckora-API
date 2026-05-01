import { z } from 'zod';

export const crearRondaSchema = z
  .object({
    tipo_ronda: z.enum(['swiss', 'eliminacion_directa', 'final']),
    asignaciones: z
      .array(
        z.object({
          inscripcion_ids: z.array(z.string().uuid()).min(2).max(4),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.tipo_ronda === 'eliminacion_directa' || data.tipo_ronda === 'final') {
        return data.asignaciones && data.asignaciones.length > 0;
      }
      return true;
    },
    {
      message:
        'El campo asignaciones es requerido para tipo_ronda eliminacion_directa o final',
    }
  );
