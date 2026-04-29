import { Router } from 'express';
import auth from '../../middleware/auth.js';
import requirePerfil from '../../middleware/requirePerfil.js';
import validate from '../../middleware/validate.js';
import { agregarCartaSchema, actualizarCantidadSchema } from './colecciones.schema.js';
import * as coleccionesController from './colecciones.controller.js';

const router = Router();

router.get('/mia', auth, requirePerfil('jugador'), coleccionesController.miColeccion);
router.post('/cartas', auth, requirePerfil('jugador'), validate(agregarCartaSchema), coleccionesController.agregarCarta);
router.patch('/cartas/:cartaId', auth, requirePerfil('jugador'), validate(actualizarCantidadSchema), coleccionesController.actualizarCarta);
router.delete('/cartas/:cartaId', auth, requirePerfil('jugador'), coleccionesController.eliminarCarta);

export default router;