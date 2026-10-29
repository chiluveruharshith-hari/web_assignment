export const ALLOWED_CATEGORIES = [
  'Electronics',
  'ID Cards',
  'Books and Stationery',
  'Bags and Wallets',
  'Clothing',
  'Keys',
  'Accessories',
  'Other'
];

export const ALLOWED_TYPES = ['lost', 'found'];
export const ALLOWED_STATUSES = ['open', 'claimed', 'returned'];
export const ALLOWED_CLAIM_STATUSES = ['pending', 'approved', 'rejected'];

export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

export const isValidUrl = (url) => {
  if (!url) return true; // optional
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  // Ensure not unreasonably far in the future (allow 1 day grace for timezones)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d <= tomorrow;
};

export const validateItemInput = (data) => {
  const errors = {};

  if (!data.itemName || typeof data.itemName !== 'string' || data.itemName.trim().length < 3) {
    errors.itemName = 'Item name is required and must be at least 3 characters.';
  } else if (data.itemName.trim().length > 100) {
    errors.itemName = 'Item name cannot exceed 100 characters.';
  }

  if (!data.type || !ALLOWED_TYPES.includes(data.type)) {
    errors.type = `Report type must be either 'lost' or 'found'.`;
  }

  if (!data.category || !ALLOWED_CATEGORIES.includes(data.category)) {
    errors.category = `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`;
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
    errors.description = 'Description is required and must be at least 10 characters.';
  } else if (data.description.trim().length > 2000) {
    errors.description = 'Description cannot exceed 2000 characters.';
  }

  if (!data.location || typeof data.location !== 'string' || data.location.trim().length < 2) {
    errors.location = 'Location is required (e.g., "Library 2nd Floor", "Main Cafeteria").';
  } else if (data.location.trim().length > 100) {
    errors.location = 'Location cannot exceed 100 characters.';
  }

  if (!data.incidentDate || !isValidDate(data.incidentDate)) {
    errors.incidentDate = 'A valid date of incident is required and cannot be in the future.';
  }

  if (data.imageUrl && !isValidUrl(data.imageUrl)) {
    errors.imageUrl = 'Image URL must be a valid HTTP or HTTPS web address.';
  }

  if (data.contactEmail && !isValidEmail(data.contactEmail)) {
    errors.contactEmail = 'Please provide a valid contact email address.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegisterInput = (data) => {
  const errors = {};

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.name = 'Full name is required (minimum 2 characters).';
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'A valid college/personal email address is required.';
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateClaimInput = (data) => {
  const errors = {};

  if (!data.explanation || typeof data.explanation !== 'string' || data.explanation.trim().length < 10) {
    errors.explanation = 'Please explain your ownership claim in detail (minimum 10 characters).';
  } else if (data.explanation.trim().length > 2000) {
    errors.explanation = 'Explanation cannot exceed 2000 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
