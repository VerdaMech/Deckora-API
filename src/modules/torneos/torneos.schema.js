import { z } from 'zod';

const FORMATOS = ['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'];

export const crearTorneoSchema = z.object({
  nombre: z.string().min(3),
  // eslint-disable-next-line security/detect-unsafe-regex -- revisado: regex lineal y acotado, sin backtracking catastrófico (ReDoS)
  fecha: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/)),
  formato: z.enum(FORMATOS),
  descripcion: z.string().max(2000).nullish(),
  cupo_maximo: z.number().int().positive().nullable().optional(),
  ubicacion: z.string().optional(),
  precio: z.number().int().min(0).optional(),
  publico: z.boolean().optional(),
}).refine(
  (data) => new Date(data.fecha) > new Date(),
  { message: 'La fecha del torneo no puede ser en el pasado', path: ['fecha'] },
);

export const actualizarTorneoSchema = z.object({
  nombre: z.string().min(3).optional(),
  // eslint-disable-next-line security/detect-unsafe-regex -- revisado: regex lineal y acotado, sin backtracking catastrófico (ReDoS)
  fecha: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/)).optional(),
  formato: z.enum(FORMATOS).optional(),
  descripcion: z.string().max(2000).nullish(),
  cupo_maximo: z.number().int().positive().nullable().optional(),
  ubicacion: z.string().optional(),
  precio: z.number().int().min(0).optional(),
  publico: z.boolean().optional(),
})
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  })
  .refine(
    (data) => !data.fecha || new Date(data.fecha) > new Date(),
    { message: 'La fecha del torneo no puede ser en el pasado', path: ['fecha'] },
  );

export const inscribirSchema = z.object({
  mazo_id: z.string().uuid(),
});

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['pendiente', 'en_curso', 'finalizado', 'cancelado']),
});