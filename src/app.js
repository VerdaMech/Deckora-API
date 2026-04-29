import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// --- Rutas de módulos (se importarán aquí a medida que se desarrollen) ---
// import authRoutes from './modules/auth/auth.routes.js';
// app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
