import { z } from 'zod';

export const signupSchema = z.object({
  nombre_usuario: z.string().min(3),
  correo: z.string().email(),
  password: z.string().min(8),
  rol: z.enum(['jugador', 'organizador', 'tienda']),
});

export const loginSchema = z.object({
  correo: z.string().email(),
  password: z.string().min(8),
});
