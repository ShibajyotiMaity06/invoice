const { validationResult } = require('express-validator');
const Client = require('../models/Client');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new client
// @route   POST /api/v1/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  const { name, email, phone, address, notes, tags } = req.body;

  // Check for duplicate client name in workspace
  const existingClient = await Client.findOne({
    workspace: req.workspace._id,
    name: { $regex: new RegExp(`^${name}$`, 'i') },
  });

  if (existingClient) {
    throw new ApiError(400, 'A client with this name already exists');
  }

  const client = await Client.create({
    workspace: req.workspace._id,
    name,
    email,
    phone,
    address,
    notes,
    tags,
    defaultCurrency: req.workspace.defaultCurrency,
    defaultPaymentTerms: req.workspace.defaultPaymentTerms,
  });

  res.status(201).json(
    new ApiResponse(201, { client }, 'Client created successfully')
  );
});

// @desc    Get all clients for workspace
// @route   GET /api/v1/clients
// @access  Private
const getClients = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  const {
    page = 1,
    limit = 20,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
    isActive,
  } = req.query;

  const query = { workspace: req.workspace._id };

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Active filter
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [clients, total] = await Promise.all([
    Client.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Client.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  res.status(200).json(
    new ApiResponse(200, {
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    }, 'Clients fetched successfully')
  );
});

// @desc    Get single client
// @route   GET /api/v1/clients/:id
// @access  Private
const getClient = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  const client = await Client.findOne({
    _id: req.params.id,
    workspace: req.workspace._id,
  });

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  res.status(200).json(
    new ApiResponse(200, { client }, 'Client fetched successfully')
  );
});

// @desc    Update client
// @route   PUT /api/v1/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  let client = await Client.findOne({
    _id: req.params.id,
    workspace: req.workspace._id,
  });

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  const { name, email, phone, address, notes, tags, isActive } = req.body;

  // Check for duplicate name (excluding current client)
  if (name && name !== client.name) {
    const existingClient = await Client.findOne({
      workspace: req.workspace._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: client._id },
    });

    if (existingClient) {
      throw new ApiError(400, 'A client with this name already exists');
    }
  }

  // Update fields
  if (name !== undefined) client.name = name;
  if (email !== undefined) client.email = email;
  if (phone !== undefined) client.phone = phone;
  if (address !== undefined) client.address = { ...client.address, ...address };
  if (notes !== undefined) client.notes = notes;
  if (tags !== undefined) client.tags = tags;
  if (isActive !== undefined) client.isActive = isActive;

  await client.save();

  res.status(200).json(
    new ApiResponse(200, { client }, 'Client updated successfully')
  );
});

// @desc    Delete client
// @route   DELETE /api/v1/clients/:id
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  const client = await Client.findOne({
    _id: req.params.id,
    workspace: req.workspace._id,
  });

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  // Check if client has invoices (we'll implement this later)
  // For now, we'll do a soft delete by setting isActive to false
  // Or you can do hard delete:
  
  // Option 1: Soft delete
  // client.isActive = false;
  // await client.save();

  // Option 2: Hard delete
  await Client.deleteOne({ _id: client._id });

  res.status(200).json(
    new ApiResponse(200, null, 'Client deleted successfully')
  );
});

// @desc    Get client statistics
// @route   GET /api/v1/clients/stats
// @access  Private
const getClientStats = asyncHandler(async (req, res) => {
  const stats = await Client.aggregate([
    { $match: { workspace: req.workspace._id } },
    {
      $group: {
        _id: null,
        totalClients: { $sum: 1 },
        activeClients: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        totalInvoiced: { $sum: '$totalInvoiced' },
        totalPaid: { $sum: '$totalPaid' },
      },
    },
  ]);

  const result = stats[0] || {
    totalClients: 0,
    activeClients: 0,
    totalInvoiced: 0,
    totalPaid: 0,
  };

  res.status(200).json(
    new ApiResponse(200, { stats: result }, 'Client stats fetched successfully')
  );
});

module.exports = {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getClientStats,
};