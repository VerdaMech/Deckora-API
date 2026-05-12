import { Router } from 'express';
import auth from '../../middleware/auth.js';
import requirePerfil from '../../middleware/requirePerfil.js';
import * as jugadoresController from './jugadores.controller.js';

const router = Router();

router.get('/me/torneos', auth, requirePerfil('jugador'), jugadoresController.misTorneos);
router.get('/me/inscripciones', auth, requirePerfil('jugador'), jugadoresController.misInscripciones);
router.get('/:id/mazos', jugadoresController.mazosPublicos);

export default router;
