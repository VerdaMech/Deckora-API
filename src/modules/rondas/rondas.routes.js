import { Router } from 'express';
import auth from '../../middleware/auth.js';
import validate from '../../middleware/validate.js';
import { crearRondaSchema } from './rondas.schema.js';
import * as rondasController from './rondas.controller.js';

const router = Router();

router.post('/:torneoId/rondas', auth, validate(crearRondaSchema), rondasController.crearRonda);
router.get('/:torneoId/rondas', rondasController.listarRondas);
router.get('/:torneoId/rondas/:rondaId', rondasController.obtenerRonda);

export default router;
