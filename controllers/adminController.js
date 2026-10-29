import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import User from '../models/User.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalReports,
      lostReports,
      foundReports,
      openReports,
      claimedReports,
      returnedItems,
      pendingClaims,
      totalUsers
    ] = await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'open' }),
      Item.countDocuments({ status: 'claimed' }),
      Item.countDocuments({ status: 'returned' }),
      Claim.countDocuments({ status: 'pending' }),
      User.countDocuments()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalReports,
        lostReports,
        foundReports,
        openReports,
        claimedReports,
        returnedItems,
        pendingClaims,
        totalUsers
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminItems = async (req, res, next) => {
  try {
    const { type, status, category, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type && ['lost', 'found'].includes(type)) query.type = type;
    if (status && ['open', 'claimed', 'returned'].includes(status)) query.status = status;
    if (category && category !== 'all') query.category = category;

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { itemName: { $regex: regex } },
        { description: { $regex: regex } },
        { location: { $regex: regex } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const totalItems = await Item.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    // In admin view, include privateDetails for verification
    const items = await Item.find(query)
      .populate('owner', 'name email role')
      .populate('resolvedClaim')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: items.length,
      totalItems,
      totalPages,
      currentPage: pageNum,
      data: items
    });
  } catch (err) {
    next(err);
  }
};

export const updateItemStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'claimed', 'returned'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be open, claimed, or returned.'
      });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.'
      });
    }

    item.status = status;
    if (status === 'returned') {
      item.resolvedAt = new Date();
    } else if (status === 'open') {
      item.resolvedAt = null;
      item.resolvedClaim = null;
    }

    await item.save();

    return res.status(200).json({
      success: true,
      message: `Item status updated to '${status}'.`,
      data: item
    });
  } catch (err) {
    next(err);
  }
};

export const deleteItemAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.'
      });
    }

    await Item.findByIdAndDelete(id);
    await Claim.deleteMany({ item: id });

    return res.status(200).json({
      success: true,
      message: 'Item and all associated claims removed successfully by administrator.'
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminClaims = async (req, res, next) => {
  try {
    const { status, itemId } = req.query;
    const query = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    if (itemId) {
      query.item = itemId;
    }

    const claims = await Claim.find(query)
      .populate('item', 'itemName type category location status imageUrl privateDetails incidentDate')
      .populate('claimant', 'name email')
      .populate('reviewedBy', 'name email')
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

export const reviewClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, reviewNotes = '' } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be either 'approved' or 'rejected'."
      });
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim record not found.'
      });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This claim has already been evaluated as '${claim.status}'.`
      });
    }

    const item = await Item.findById(claim.item);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Associated item report no longer exists.'
      });
    }

    if (decision === 'approved') {
      // Conflict check: Ensure item is not already marked as returned or claimed by someone else
      if (item.status === 'returned') {
        return res.status(409).json({
          success: false,
          message: 'Cannot approve claim: Item has already been returned to another party.'
        });
      }

      // Update approved claim
      claim.status = 'approved';
      claim.reviewedBy = req.user._id;
      claim.reviewedAt = new Date();
      claim.reviewNotes = reviewNotes.trim();
      await claim.save();

      // Update item to 'claimed' and record the winning claim
      item.status = 'claimed';
      item.resolvedClaim = claim._id;
      await item.save();

      // Reject all other pending claims on this item to prevent simultaneous claims
      await Claim.updateMany(
        { item: item._id, _id: { $ne: claim._id }, status: 'pending' },
        {
          $set: {
            status: 'rejected',
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNotes: 'Another verified claim was approved for this item by administration.'
          }
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Claim has been approved. The item status is now set to "claimed".',
        data: claim
      });
    } else {
      // Rejection
      claim.status = 'rejected';
      claim.reviewedBy = req.user._id;
      claim.reviewedAt = new Date();
      claim.reviewNotes = reviewNotes.trim() || 'Claim did not match identifying characteristics.';
      await claim.save();

      return res.status(200).json({
        success: true,
        message: 'Claim has been rejected.',
        data: claim
      });
    }
  } catch (err) {
    next(err);
  }
};
