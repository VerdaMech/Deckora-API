import { z } from 'zod';

export const actualizarTiendaSchema = z.object({
  nombre_tienda: z.string().min(1).optional(),
  direccion: z.string().min(1).optional(),
  numero_telefono: z.string().optional(),
  horario_apertura: z.string().optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
});

export const cercanaQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radio: z.coerce.number().positive().default(10),
});
