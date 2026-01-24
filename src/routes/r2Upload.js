/**
 * R2 Upload Routes
 * Routes for direct-to-R2 uploads using presigned URLs
 */

import { Router } from 'express';
import * as r2UploadController from '../controllers/r2UploadController.js';
import authenticate from '../middleware/auth.js';

const router = Router();

// Get storage provider info (public)
router.get('/storage-info', r2UploadController.getStorageInfo);

// Protected routes
router.use(authenticate);

// Initialize R2 multipart upload (returns presigned URLs)
router.post('/r2/init', r2UploadController.initR2Upload);

// Complete R2 multipart upload
router.post('/r2/complete/:sessionId', r2UploadController.completeR2Upload);

// Abort R2 multipart upload
router.delete('/r2/abort/:sessionId', r2UploadController.abortR2Upload);

export default router;
