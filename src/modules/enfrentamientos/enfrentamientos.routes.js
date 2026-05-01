import { Router } from 'express';
import auth from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import { registrarResultadoSchema, cambiarEstadoSchema } from './enfrentamientos.schema.js';
import * as enfrentamientosController from './enfrentamientos.controller.js';

const router = Router();

router.get('/:id', enfrentamientosController.obtenerEnfrentamiento);
router.patch(
  '/:id/resultado',
  auth,
  validate(registrarResultadoSchema),
  enfrentamientosController.registrarResultado
);
router.patch(
  '/:id/estado',
  auth,
  validate(cambiarEstadoSchema),
  enfrentamientosController.cambiarEstado
);

export default router;
