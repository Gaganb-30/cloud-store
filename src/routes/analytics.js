/**
 * Analytics Routes
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getUserAnalytics } from '../controllers/analyticsController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user analytics
router.get('/', getUserAnalytics);

export default router;
