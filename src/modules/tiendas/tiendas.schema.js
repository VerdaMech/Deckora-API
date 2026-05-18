import { z } from 'zod';

export const actualizarTiendaSchema = z.object({
  nombre_tienda: z.string().min(1).optional(),
  direccion: z.string().min(1).optional(),
  numero_telefono: z.string().optional(),
  horario_apertura: z.string().optional(),
  latitud: z.number().min(-90).max(90).optional().nullable(),
  longitud: z.number().min(-180).max(180).optional().nullable(),
});

export const cercanaQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radio: z.coerce.number().positive().default(10),
});
