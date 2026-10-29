import Item from '../models/Item.js';
import Claim from '../models/Claim.js';
import { validateItemInput } from '../utils/validators.js';

export const getItems = async (req, res, next) => {
  try {
    const {
      type,
      category,
      location,
      status,
      search,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Filter by type (lost or found)
    if (type && ['lost', 'found'].includes(type)) {
      query.type = type;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by location substring
    if (location && location.trim() !== '') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    // Filter by status (default to open if specified, or all)
    if (status && ['open', 'claimed', 'returned'].includes(status)) {
      query.status = status;
    }

    // Search keyword across itemName, description, and location
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { itemName: { $regex: regex } },
        { description: { $regex: regex } },
        { location: { $regex: regex } }
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'incidentDate') {
      sortOption = { incidentDate: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const totalItems = await Item.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    // Exclude private identifying details in public listing
    const items = await Item.find(query)
      .select('-privateDetails')
      .populate('owner', 'name email role')
      .sort(sortOption)
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

export const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Item.findById(id).populate('owner', 'name email role');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'The requested item report was not found.'
      });
    }

    // Check if user is authorized to see private details (owner or admin)
    const isOwner = req.user && item.owner && item.owner._id.equals(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';

    const itemData = item.toObject();
    if (!isOwner && !isAdmin) {
      delete itemData.privateDetails;
    }

    // If item is found, count pending claims
    let claimCount = 0;
    if (item.type === 'found') {
      claimCount = await Claim.countDocuments({ item: item._id });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...itemData,
        claimCount
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createItem = async (req, res, next) => {
  try {
    const validation = validateItemInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const {
      itemName,
      type,
      category,
      description,
      location,
      incidentDate,
      imageUrl,
      contactEmail,
      privateDetails
    } = req.body;

    const newItem = await Item.create({
      itemName: itemName.trim(),
      type,
      category,
      description: description.trim(),
      location: location.trim(),
      incidentDate: new Date(incidentDate),
      imageUrl: imageUrl ? imageUrl.trim() : '',
      contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : (req.user.email || ''),
      privateDetails: privateDetails ? privateDetails.trim() : '',
      owner: req.user._id,
      status: 'open'
    });

    const populatedItem = await Item.findById(newItem._id).populate('owner', 'name email role');

    return res.status(201).json({
      success: true,
      message: `${type === 'lost' ? 'Lost' : 'Found'} item report submitted successfully.`,
      data: populatedItem
    });
  } catch (err) {
    next(err);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.'
      });
    }

    const isOwner = item.owner.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this item report.'
      });
    }

    // Validate update fields if provided
    const fieldsToUpdate = {};
    const {
      itemName,
      category,
      description,
      location,
      incidentDate,
      imageUrl,
      contactEmail,
      privateDetails,
      status
    } = req.body;

    if (itemName !== undefined) fieldsToUpdate.itemName = itemName.trim();
    if (category !== undefined) fieldsToUpdate.category = category;
    if (description !== undefined) fieldsToUpdate.description = description.trim();
    if (location !== undefined) fieldsToUpdate.location = location.trim();
    if (incidentDate !== undefined) fieldsToUpdate.incidentDate = new Date(incidentDate);
    if (imageUrl !== undefined) fieldsToUpdate.imageUrl = imageUrl.trim();
    if (contactEmail !== undefined) fieldsToUpdate.contactEmail = contactEmail.trim().toLowerCase();
    if (privateDetails !== undefined) fieldsToUpdate.privateDetails = privateDetails.trim();

    // Only admin or item owner can change status
    if (status !== undefined && ['open', 'claimed', 'returned'].includes(status)) {
      fieldsToUpdate.status = status;
      if (status === 'returned') {
        fieldsToUpdate.resolvedAt = new Date();
      }
    }

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).populate('owner', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Item report updated successfully.',
      data: updatedItem
    });
  } catch (err) {
    next(err);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.'
      });
    }

    const isOwner = item.owner.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this report.'
      });
    }

    // Delete item and remove associated claims safely
    await Item.findByIdAndDelete(id);
    await Claim.deleteMany({ item: id });

    return res.status(200).json({
      success: true,
      message: 'Item report and related claims deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    // Derive all metrics purely from MongoDB aggregations
    const [
      totalReports,
      lostReports,
      foundReports,
      openReports,
      claimedReports,
      returnedItems,
      pendingClaims
    ] = await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'open' }),
      Item.countDocuments({ status: 'claimed' }),
      Item.countDocuments({ status: 'returned' }),
      Claim.countDocuments({ status: 'pending' })
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
        pendingClaims
      }
    });
  } catch (err) {
    next(err);
  }
};
