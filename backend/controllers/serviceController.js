const serviceService = require("../services/serviceService");

/**
 * Extracts image URLs from uploaded files.
 * @param {Array} files - The array of uploaded file objects from Multer.
 * @returns {Array} An array of URL paths for the uploaded images.
 * @private
 */
function _handleImageUploads(files) {
  const imageUrls = [];
  if (files && files.length > 0) {
    files.forEach(file => {
      imageUrls.push(`/uploads/${file.filename}`);
    });
  }
  return imageUrls;
}

/**
 * Parses the service data from the request body, handling both JSON and FormData.
 * @param {object} body - The request body.
 * @returns {object} A cleaned and parsed service data object.
 * @private
 */
function _parseServiceBody(body) {
  if (!body || typeof body !== 'object') {
    return {};
  }
  
  const parsedBody = {
    name: body.name,
    category: body.category,
    description: body.description,
    price: body.price ? parseFloat(body.price) : undefined,
    duration: body.duration ? parseInt(body.duration) : undefined,
    currency: body.currency,
    image: body.image,
  };

  // Remove fields that are undefined to avoid overwriting existing data with nulls
  Object.keys(parsedBody).forEach(key => parsedBody[key] === undefined && delete parsedBody[key]);
  
  return parsedBody;
}

/**
 * @desc    Get all active services, with optional filtering by provider.
 * @route   GET /api/services
 * @access  Public
 */
const getAll = async (req, res) => {
  try {
    const { providerId } = req.query;
    const services = await serviceService.getAllServices(providerId);
    res.status(200).json(services);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(err.status || 500).json({ message: err.message || "Failed to fetch services" });
  }
};

/**
 * @desc    Get a single service by its ID.
 * @route   GET /api/services/:id
 * @access  Public
 */
const getOne = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    res.status(200).json(service);
  } catch (err) {
    console.error("Error fetching service:", err);
    res.status(err.status || 500).json({ message: err.message || "Failed to fetch service" });
  }
};

/**
 * @desc    Create a new service.
 * @route   POST /api/services
 * @access  Provider
 */
const create = async (req, res) => {
  try {
    // Authorization: Only providers can create services.
    // For larger applications, this logic would be better placed in a middleware.
    if (req.user?.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can create services" });
    }
    
    const imageUrls = _handleImageUploads(req.files);
    const body = _parseServiceBody(req.body);
    
    const serviceData = {
      ...body,
      providerId: req.user.userId,
      images: imageUrls,
      image: imageUrls[0] || body.image || "💇", // Default or fallback image
    };

    const service = await serviceService.createService(serviceData);
    res.status(201).json(service);
  } catch (err) {
    console.error("Error creating service:", err);
    res.status(err.status || 500).json({ message: err.message || "Failed to create service" });
  }
};

/**
 * @desc    Update an existing service.
 * @route   PUT /api/services/:id
 * @access  Provider (owner)
 */
const update = async (req, res) => {
  try {
    // For larger apps, this should be a middleware.
    if (req.user?.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can update services" });
    }

    const imageUrls = _handleImageUploads(req.files);
    const body = _parseServiceBody(req.body);

    if (imageUrls.length > 0) {
      body.images = imageUrls;
      body.image = imageUrls[0] || body.image;
    }
    
    const service = await serviceService.updateService(req.params.id, body, req.user.userId);
    res.status(200).json(service);
  } catch (err) {
    console.error("Error updating service:", err);
    res.status(err.status || 500).json({ message: err.message || "Failed to update service" });
  }
};

/**
 * @desc    Soft delete a service.
 * @route   DELETE /api/services/:id
 * @access  Provider (owner)
 */
const remove = async (req, res) => {
  try {
    // For larger apps, this should be a middleware.
    if (req.user?.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can delete services" });
    }

    await serviceService.deleteService(req.params.id, req.user.userId);
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("Error deleting service:", err);
    res.status(err.status || 500).json({ message: err.message || "Failed to delete service" });
  }
};

module.exports = { getAll, getOne, create, update, remove };
