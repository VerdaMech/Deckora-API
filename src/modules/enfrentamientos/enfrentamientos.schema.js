import { z } from 'zod';

export const registrarResultadoSchema = z.object({
  resultados: z
    .array(
      z.object({
        inscripcion_id: z.string().uuid(),
        resultado: z.enum(['ganador', 'empate', 'derrota']),
      })
    )
    .min(2),
});

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['en_curso', 'finalizado']),
});
