import express from 'express';
import {
  getAdminStats,
  getAdminItems,
  updateItemStatus,
  deleteItemAdmin,
  getAdminClaims,
  reviewClaim
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication & admin authorization on all /api/admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/items', getAdminItems);
router.patch('/items/:id/status', updateItemStatus);
router.delete('/items/:id', deleteItemAdmin);

router.get('/claims', getAdminClaims);
router.patch('/claims/:id', reviewClaim);

export default router;
