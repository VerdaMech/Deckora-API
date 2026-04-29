import { Router } from 'express';
import auth from '../../middleware/auth.js';
import * as tiendasController from './tiendas.controller.js';

const router = Router();

// /cercanas debe ir antes de /:id para no ser interpretada como un ID
router.get('/cercanas', tiendasController.cercanas);

router.get('/', tiendasController.listar);
router.get('/:id', tiendasController.obtenerPorId);
router.put('/:id', auth, tiendasController.actualizar);
router.get('/:id/torneos', tiendasController.obtenerTorneos);

export default router;
