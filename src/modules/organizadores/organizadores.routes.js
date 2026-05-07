import { Router } from 'express';
import auth from '../../middleware/auth.js';
import requirePerfil from '../../middleware/requirePerfil.js';
import * as organizadoresController from './organizadores.controller.js';

const router = Router();

router.get('/me', auth, requirePerfil('organizador'), organizadoresController.obtenerMio);
router.patch('/me', auth, requirePerfil('organizador'), organizadoresController.actualizarMio);

export default router;
