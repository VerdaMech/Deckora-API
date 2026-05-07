import { z } from 'zod';

export const actualizarOrganizadorSchema = z.object({
  descripcion: z.string().max(1000).optional(),
  sitio_web: z.string().url().optional().or(z.literal('')),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar',
});
