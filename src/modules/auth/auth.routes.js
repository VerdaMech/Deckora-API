import { Router } from 'express';
import validate from '../../middleware/validate.js';
import auth from '../../middleware/auth.js';
import { signupSchema, loginSchema } from './auth.schema.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', auth, authController.me);
router.post('/logout', auth, authController.logout);

export default router;
