const { validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new invoice
// @route   POST /api/v1/invoices
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  const {
    clientId,
    issueDate,
    dueDate,
    lineItems,
    discountType,
    discountValue,
    notes,
    currency,
    status = 'draft',
  } = req.body;

  // Verify client exists and belongs to workspace
  const client = await Client.findOne({
    _id: clientId,
    workspace: req.workspace._id,
  });

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  // Get next invoice number
  const workspace = await Workspace.findById(req.workspace._id);
  const invoiceNumber = `${workspace.invoicePrefix}-${String(workspace.nextInvoiceNumber).padStart(5, '0')}`;

  // Create invoice
  const invoice = await Invoice.create({
    workspace: req.workspace._id,
    client: clientId,
    invoiceNumber,
    status,
    issueDate: issueDate || new Date(),
    dueDate,
    lineItems,
    discountType,
    discountValue,
    notes,
    currency: currency || workspace.defaultCurrency,
  });

  // Increment invoice number
  workspace.nextInvoiceNumber += 1;
  await workspace.save();

  // Populate client for response
  await invoice.populate('client', 'name email');

  res.status(201).json(
    new ApiResponse(201, { invoice }, 'Invoice created successfully')
  );
});

// @desc    Get all invoices
// @route   GET /api/v1/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    clientId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const query = { workspace: req.workspace._id };

  if (status) query.status = status;
  if (clientId) query.client = clientId;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate('client', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Invoice.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  res.status(200).json(
    new ApiResponse(200, {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    }, 'Invoices fetched successfully')
  );
});

// @desc    Get single invoice
// @route   GET /api/v1/invoices/:id
// @access  Private
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    workspace: req.workspace._id,
  }).populate('client');

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  res.status(200).json(
    new ApiResponse(200, { invoice }, 'Invoice fetched successfully')
  );
});

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:id
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  let invoice = await Invoice.findOne({
    _id: req.params.id,
    workspace: req.workspace._id,
  });

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  // Only allow editing draft invoices
  if (invoice.status !== 'draft') {
    throw new ApiError(400, 'Only draft invoices can be edited');
  }

  const {
    clientId,
    issueDate,
    dueDate,
    lineItems,
    discountType,
    discountValue,
    notes,
    currency,
    status,
  } = req.body;

  // If changing client, verify it exists
  if (clientId && clientId !== invoice.client.toString()) {
    const client = await Client.findOne({
      _id: clientId,
      workspace: req.workspace._id,
    });
    if (!client) {
      throw new ApiError(404, 'Client not found');
    }
    invoice.client = clientId;
  }

  if (issueDate) invoice.issueDate = issueDate;
  if (dueDate) invoice.dueDate = dueDate;
  if (lineItems) invoice.lineItems = lineItems;
  if (discountType) invoice.discountType = discountType;
  if (discountValue !== undefined) invoice.discountValue = discountValue;
  if (notes !== undefined) invoice.notes = notes;
  if (currency) invoice.currency = currency;
  if (status) invoice.status = status;

  await invoice.save();
  await invoice.populate('client', 'name email');

  res.status(200).json(
    new ApiResponse(200, { invoice }, 'Invoice updated successfully')
  );
});

// @desc    Delete invoice
// @route   DELETE /api/v1/invoices/:id
// @access  Private
const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    workspace: req.workspace._id,
  });

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  // Only allow deleting draft invoices
  if (invoice.status !== 'draft') {
    throw new ApiError(400, 'Only draft invoices can be deleted');
  }

  await Invoice.deleteOne({ _id: invoice._id });

  res.status(200).json(
    new ApiResponse(200, null, 'Invoice deleted successfully')
  );
});

// @desc    Get invoice stats
// @route   GET /api/v1/invoices/stats
// @access  Private
const getInvoiceStats = asyncHandler(async (req, res) => {
  const stats = await Invoice.aggregate([
    { $match: { workspace: req.workspace._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total' },
      },
    },
  ]);

  const formattedStats = {
    draft: { count: 0, total: 0 },
    sent: { count: 0, total: 0 },
    viewed: { count: 0, total: 0 },
    paid: { count: 0, total: 0 },
    overdue: { count: 0, total: 0 },
    cancelled: { count: 0, total: 0 },
  };

  stats.forEach((stat) => {
    formattedStats[stat._id] = {
      count: stat.count,
      total: stat.total,
    };
  });

  res.status(200).json(
    new ApiResponse(200, { stats: formattedStats }, 'Stats fetched successfully')
  );
});

// @desc    Get public invoice by access token
// @route   GET /api/v1/invoices/public/:token
// @access  Public
const getPublicInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    accessToken: req.params.token,
  })
    .populate('client')
    .populate('workspace', 'name email phone logo address website');

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  // Track view
  if (invoice.status === 'sent') {
    invoice.status = 'viewed';
  }
  invoice.viewedAt.push(new Date());
  await invoice.save();

  res.status(200).json(
    new ApiResponse(200, { invoice }, 'Invoice fetched successfully')
  );
});

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
  getPublicInvoice,
};