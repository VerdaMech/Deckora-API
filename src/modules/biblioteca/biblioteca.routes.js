import { Router } from 'express';
import * as bibliotecaController from './biblioteca.controller.js';

const router = Router();

router.get('/cartas', bibliotecaController.listarCartas);
router.get('/sets', bibliotecaController.listarSets);

export default router;
