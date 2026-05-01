import { Router } from 'express';
import * as cartasController from './cartas.controller.js';

const router = Router();

router.get('/buscar', cartasController.buscar);
router.get('/', cartasController.listar);
router.get('/:scryfallId', cartasController.obtenerPorScryfallId);

export default router;
