import { z } from 'zod';

const FORMATOS = ['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'];

export const crearTorneoSchema = z.object({
  nombre: z.string().min(3),
  fecha: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/)),
  formato: z.enum(FORMATOS),
  descripcion: z.string().max(2000).nullish(),
  cupo_maximo: z.number().int().positive().optional(),
  ubicacion: z.string().optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  precio: z.number().int().min(0).optional(),
  publico: z.boolean().optional(),
});

export const actualizarTorneoSchema = z.object({
  nombre: z.string().min(3).optional(),
  fecha: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/)).optional(),
  formato: z.enum(FORMATOS).optional(),
  descripcion: z.string().max(2000).nullish(),
  cupo_maximo: z.number().int().positive().optional(),
  ubicacion: z.string().optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  precio: z.number().int().min(0).optional(),
  publico: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar',
});

export const inscribirSchema = z.object({
  mazo_id: z.string().uuid(),
});

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['pendiente', 'en_curso', 'finalizado', 'cancelado']),
});