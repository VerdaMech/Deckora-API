import { Router } from 'express';
import auth from '../../middleware/auth.js';
import requirePerfil from '../../middleware/requirePerfil.js';
import validate from '../../middleware/validate.js';
import { crearTorneoSchema, actualizarTorneoSchema, inscribirSchema } from './torneos.schema.js';
import * as torneosController from './torneos.controller.js';

const router = Router();

router.get('/', torneosController.listar);
router.post('/', auth, validate(crearTorneoSchema), torneosController.crear);
router.get('/:id', torneosController.obtenerPorId);
router.patch('/:id', auth, validate(actualizarTorneoSchema), torneosController.actualizar);
router.post('/:id/inscripciones', auth, requirePerfil('jugador'), validate(inscribirSchema), torneosController.inscribir);
router.get('/:id/inscripciones', torneosController.listarInscripciones);
router.get('/:id/tabla-posiciones', torneosController.obtenerTablaPosiciones);
router.patch('/:id/cerrar', auth, torneosController.cerrarTorneo);

export default router;