import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import cartasRoutes from './modules/cartas/cartas.routes.js';
import tiendasRoutes from './modules/tiendas/tiendas.routes.js';
import coleccionesRoutes from './modules/colecciones/colecciones.routes.js';
import mazosRoutes from './modules/mazos/mazos.routes.js';
import torneosRoutes from './modules/torneos/torneos.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cartas', cartasRoutes);
app.use('/api/tiendas', tiendasRoutes);
app.use('/api/colecciones', coleccionesRoutes);
app.use('/api/mazos', mazosRoutes);
app.use('/api/torneos', torneosRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
