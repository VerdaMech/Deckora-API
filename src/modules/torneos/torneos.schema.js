import { z } from 'zod';

const FORMATOS = ['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'];

export const crearTorneoSchema = z.object({
  nombre: z.string().min(3),
  fecha: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/)),
  formato: z.enum(FORMATOS),
  cupo_maximo: z.number().int().positive().optional(),
  ubicacion: z.string().optional(),
});

export const inscribirSchema = z.object({
  mazo_id: z.string().uuid(),
});