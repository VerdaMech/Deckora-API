import { ZodError } from 'zod';
import { ConnectionError } from 'sequelize';

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

  // Base de datos no disponible (conexión rechazada, host inalcanzable, timeout de
  // conexión): se responde 503 con un JSON limpio, sin filtrar detalles internos.
  if (err instanceof ConnectionError) {
    return res.status(503).json({
      error: 'Servicio no disponible temporalmente. Intenta nuevamente en unos momentos.',
    });
  }

  const status = err.status ?? err.statusCode ?? 500;
  const mensaje = err.message ?? 'Error interno del servidor';

  res.status(status).json({ error: mensaje });
}
