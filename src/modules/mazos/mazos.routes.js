import { Router } from 'express';
import auth from '../../middleware/auth.js';
import requirePerfil from '../../middleware/requirePerfil.js';
import validate from '../../middleware/validate.js';
import {
  crearMazoSchema,
  agregarCartaMazoSchema,
  actualizarCartaMazoSchema,
} from './mazos.schema.js';
import * as mazosController from './mazos.controller.js';

const router = Router();

router.get('/', auth, requirePerfil('jugador'), mazosController.listar);
router.post('/', auth, requirePerfil('jugador'), validate(crearMazoSchema), mazosController.crear);
router.get('/:id', auth, requirePerfil('jugador'), mazosController.obtenerPorId);
router.post('/:id/cartas', auth, requirePerfil('jugador'), validate(agregarCartaMazoSchema), mazosController.agregarCarta);
router.patch('/:id/cartas/:cartaId', auth, requirePerfil('jugador'), validate(actualizarCartaMazoSchema), mazosController.actualizarCarta);
router.delete('/:id/cartas/:cartaId', auth, requirePerfil('jugador'), mazosController.eliminarCarta);
router.post('/:id/validar', auth, requirePerfil('jugador'), mazosController.validar);

export default router;