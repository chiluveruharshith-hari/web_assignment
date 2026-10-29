import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
} from '../controllers/itemController.js';
import { createClaim } from '../controllers/claimController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getItems)
  .post(protect, createItem);

router.route('/:id')
  .get(optionalAuth, getItemById)
  .patch(protect, updateItem)
  .delete(protect, deleteItem);

// Nested claim creation route for an item
router.post('/:id/claims', protect, createClaim);

export default router;
