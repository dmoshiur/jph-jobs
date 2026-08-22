import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { authRateLimit } from '../../middleware/security.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from './auth.validators.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, validate(registerSchema), controller.register);
authRouter.post('/login', authRateLimit, validate(loginSchema), controller.login);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', requireAuth, controller.logout);
authRouter.get('/me', requireAuth, controller.me);
authRouter.post('/forgot-password', authRateLimit, validate(forgotPasswordSchema), controller.forgotPassword);
authRouter.post('/reset-password', authRateLimit, validate(resetPasswordSchema), controller.resetPassword);
authRouter.post('/verify-email', validate(verifyEmailSchema), controller.verifyEmail);
