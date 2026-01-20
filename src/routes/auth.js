/**
 * Auth Routes
 */
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import authenticate from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/refresh', authRateLimit, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/change-username', authenticate, authController.changeUsername);
router.post('/change-email', authenticate, authController.changeEmail);

export default router;
