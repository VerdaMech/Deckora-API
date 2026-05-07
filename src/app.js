import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import cartasRoutes from './modules/cartas/cartas.routes.js';
import tiendasRoutes from './modules/tiendas/tiendas.routes.js';
import coleccionesRoutes from './modules/colecciones/colecciones.routes.js';
import mazosRoutes from './modules/mazos/mazos.routes.js';
import torneosRoutes from './modules/torneos/torneos.routes.js';
import rondasRoutes from './modules/rondas/rondas.routes.js';
import enfrentamientosRoutes from './modules/enfrentamientos/enfrentamientos.routes.js';
import estadisticasRoutes from './modules/estadisticas/estadisticas.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
import organizadoresRoutes from './modules/organizadores/organizadores.routes.js';
import jugadoresRoutes from './modules/jugadores/jugadores.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cartas', cartasRoutes);
app.use('/api/tiendas', tiendasRoutes);
app.use('/api/colecciones', coleccionesRoutes);
app.use('/api/mazos', mazosRoutes);
app.use('/api/torneos', torneosRoutes);
app.use('/api/torneos', rondasRoutes);
app.use('/api/enfrentamientos', enfrentamientosRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/organizadores', organizadoresRoutes);
app.use('/api/jugadores', jugadoresRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
