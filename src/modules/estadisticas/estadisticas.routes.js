import { Router } from 'express';
import auth from '../../middleware/auth.js';
import requirePerfil from '../../middleware/requirePerfil.js';
import * as estadisticasController from './estadisticas.controller.js';

const router = Router();

router.get('/mias', auth, requirePerfil('jugador'), estadisticasController.obtenerMias);
router.get('/ranking', estadisticasController.obtenerRanking);
router.get('/jugadores/:jugadorId', estadisticasController.obtenerPublico);
router.get('/jugadores/:jugadorId/historial-diario', estadisticasController.obtenerHistorialDiario);

export default router;
