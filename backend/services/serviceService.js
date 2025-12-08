const mongoose = require("mongoose");
const Service = require("../models/Service");

/**
 * Verifies that the provider owns the service.
 * @param {string} serviceId - The ID of the service.
 * @param {string} providerId - The ID of the provider.
 * @private
 * @throws {Error} If the service is not found or the provider is not authorized.
 */
async function _verifyOwnership(serviceId, providerId) {
  const service = await Service.findById(serviceId);
  if (!service) {
    const err = new Error("Service not found");
    err.status = 404;
    throw err;
  }

  if (service.providerId.toString() !== providerId.toString()) {
    const err = new Error("Not authorized to modify this service");
    err.status = 403;
    throw err;
  }
  return service;
}


/**
 * Get all active services, optionally filtering by provider.
 * @param {string} [providerId=null] - Optional ID of the provider to filter by.
 * @returns {Promise<Service[]>} A list of services.
 */
const getAllServices = async (providerId = null) => {
  const query = { isActive: true };
  if (providerId) {
    query.providerId = mongoose.Types.ObjectId.isValid(providerId)
      ? new mongoose.Types.ObjectId(providerId)
      : providerId;
  }
  return await Service.find(query)
    .populate("providerId", "name email phone")
    .sort({ createdAt: -1 });
};

/**
 * Get a single service by its ID.
 * @param {string} id - The ID of the service.
 * @returns {Promise<Service>} The service object.
 * @throws {Error} If the service is not found.
 */
const getServiceById = async (id) => {
  const service = await Service.findById(id).populate(
    "providerId",
    "name email phone"
  );
  if (!service) {
    const err = new Error("Service not found");
    err.status = 404;
    throw err;
  }
  return service;
};

/**
 * Create a new service.
 * @param {object} data - The service data.
 * @param {string} data.providerId - The ID of the provider creating the service.
 * @returns {Promise<Service>} The newly created service.
 * @throws {Error} If the provider ID is missing.
 */
const createService = async (data) => {
  if (!data.providerId) {
    const err = new Error("Provider ID is required");
    err.status = 400;
    throw err;
  }
  const service = await Service.create(data);
  return await service.populate("providerId", "name email phone");
};

/**
 * Update an existing service.
 * @param {string} id - The ID of the service to update.
 * @param {object} data - The new service data.
 * @param {string} providerId - The ID of the provider making the update.
 * @returns {Promise<Service>} The updated service.
 * @throws {Error} If the service is not found or the provider is not authorized.
 */
const updateService = async (id, data, providerId) => {
  const service = await _verifyOwnership(id, providerId);
  Object.assign(service, data);
  await service.save();
  return await service.populate("providerId", "name email phone");
};

/**
 * Soft delete a service by setting its `isActive` flag to false.
 * @param {string} id - The ID of the service to delete.
 * @param {string} providerId - The ID of the provider making the deletion.
 * @returns {Promise<void>}
 * @throws {Error} If the service is not found or the provider is not authorized.
 */
const deleteService = async (id, providerId) => {
  const service = await _verifyOwnership(id, providerId);
  service.isActive = false;
  await service.save();
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};