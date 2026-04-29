import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import cartasRoutes from './modules/cartas/cartas.routes.js';
import tiendasRoutes from './modules/tiendas/tiendas.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cartas', cartasRoutes);
app.use('/api/tiendas', tiendasRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
