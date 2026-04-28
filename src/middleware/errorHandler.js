import { ZodError } from 'zod';

// Middleware global de manejo de errores — debe registrarse al final de app.js
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      detalles: err.errors,
    });
  }

  const status = err.status ?? err.statusCode ?? 500;
  const mensaje = err.message ?? 'Error interno del servidor';

  res.status(status).json({ error: mensaje });
}
