import express from 'express';
import { getDashboardMetrics } from '../controllers/assetController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, getDashboardMetrics);

export default router;
