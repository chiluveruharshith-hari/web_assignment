import Claim from '../models/Claim.js';
import Item from '../models/Item.js';
import { validateClaimInput } from '../utils/validators.js';

export const createClaim = async (req, res, next) => {
  try {
    const { id: itemId } = req.params;
    const { explanation, identifyingDetails, contactPhone } = req.body;

    const validation = validateClaimInput({ explanation });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'The requested item was not found.'
      });
    }

    // Rule: Claim can only be made on 'found' items
    if (item.type !== 'found') {
      return res.status(400).json({
        success: false,
        message: 'Ownership claims can only be filed on found items. For lost items, please contact the poster directly.'
      });
    }

    // Rule: Item must not already be marked as returned
    if (item.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'This item has already been verified and returned to its owner.'
      });
    }

    // Rule: Cannot claim an item you reported found yourself
    if (item.owner.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit an ownership claim for an item you reported.'
      });
    }

    // Rule: Prevent duplicate pending claims from the same user on the same item
    const existingClaim = await Claim.findOne({
      item: item._id,
      claimant: req.user._id,
      status: 'pending'
    });

    if (existingClaim) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active pending claim for this item. Please await administrator review.'
      });
    }

    const claim = await Claim.create({
      item: item._id,
      claimant: req.user._id,
      explanation: explanation.trim(),
      identifyingDetails: identifyingDetails ? identifyingDetails.trim() : '',
      contactPhone: contactPhone ? contactPhone.trim() : '',
      status: 'pending'
    });

    const populatedClaim = await Claim.findById(claim._id)
      .populate('item', 'itemName type category location status imageUrl')
      .populate('claimant', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Your ownership claim has been submitted and is pending review by campus administration.',
      data: populatedClaim
    });
  } catch (err) {
    next(err);
  }
};

export const getMyClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id })
      .populate('item', 'itemName type category location status imageUrl')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (err) {
    next(err);
  }
};
