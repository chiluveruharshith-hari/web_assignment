import express from 'express';
import { getMyClaims } from '../controllers/claimController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my', protect, getMyClaims);

export default router;
