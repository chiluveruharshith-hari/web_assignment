import mongoose from 'mongoose';
import { ALLOWED_CATEGORIES, ALLOWED_TYPES, ALLOWED_STATUSES } from '../utils/validators.js';

const itemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      minlength: [3, 'Item name must be at least 3 characters'],
      maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    type: {
      type: String,
      enum: {
        values: ALLOWED_TYPES,
        message: 'Type must be either lost or found'
      },
      required: [true, 'Report type is required']
    },
    category: {
      type: String,
      enum: {
        values: ALLOWED_CATEGORIES,
        message: 'Invalid category'
      },
      required: [true, 'Category is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      minlength: [2, 'Location must be at least 2 characters'],
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    incidentDate: {
      type: Date,
      required: [true, 'Incident date is required']
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    },
    privateDetails: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Private identifying details cannot exceed 1000 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Item must have an owner/reporter']
    },
    status: {
      type: String,
      enum: {
        values: ALLOWED_STATUSES,
        message: 'Status must be open, claimed, or returned'
      },
      default: 'open'
    },
    resolvedClaim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching and filtering
itemSchema.index({ type: 1, status: 1, createdAt: -1 });
itemSchema.index({ category: 1, type: 1 });
itemSchema.index({ itemName: 'text', description: 'text', location: 'text' });

const Item = mongoose.model('Item', itemSchema);
export default Item;
