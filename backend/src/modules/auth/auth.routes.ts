import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { authRateLimit } from '../../middleware/security.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './auth.controller.js';
import { forgotPasswordSchema, registerSchema } from './auth.validators.js';

export const authRouter = Router();

// Account creation is server-owned so the correct RBAC role is assigned.
authRouter.post('/register', authRateLimit, validate(registerSchema), controller.register);

// Firebase-authenticated endpoints (client supplies the ID token as Bearer).
authRouter.post('/session', requireAuth, controller.session);
authRouter.post('/logout', requireAuth, controller.logout);
authRouter.get('/me', requireAuth, controller.me);

// Password reset link issued via Firebase Admin.
authRouter.post('/forgot-password', authRateLimit, validate(forgotPasswordSchema), controller.forgotPassword);
