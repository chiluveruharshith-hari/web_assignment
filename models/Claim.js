import mongoose from 'mongoose';
import { ALLOWED_CLAIM_STATUSES } from '../utils/validators.js';

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Claim must reference an item']
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Claim must have a claimant user']
    },
    explanation: {
      type: String,
      required: [true, 'Please explain your ownership claim'],
      trim: true,
      minlength: [10, 'Explanation must be at least 10 characters'],
      maxlength: [2000, 'Explanation cannot exceed 2000 characters']
    },
    identifyingDetails: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Identifying details cannot exceed 1000 characters']
    },
    contactPhone: {
      type: String,
      default: '',
      trim: true,
      maxlength: [30, 'Phone number cannot exceed 30 characters']
    },
    status: {
      type: String,
      enum: {
        values: ALLOWED_CLAIM_STATUSES,
        message: 'Claim status must be pending, approved, or rejected'
      },
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Review notes cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

claimSchema.index({ item: 1, claimant: 1, status: 1 });
claimSchema.index({ status: 1, createdAt: -1 });

const Claim = mongoose.model('Claim', claimSchema);
export default Claim;
