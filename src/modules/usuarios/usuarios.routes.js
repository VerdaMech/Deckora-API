import { Router } from 'express';
import * as usuariosController from './usuarios.controller.js';

const router = Router();

router.get('/:username', usuariosController.obtenerPorUsername);

export default router;
