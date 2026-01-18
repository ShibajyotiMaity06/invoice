const { validationResult } = require('express-validator');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');

// @desc    Create business profile (workspace)
// @route   POST /api/v1/business-profile
// @access  Private
const createBusinessProfile = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  // Check if user already has a workspace
  const existingWorkspace = await Workspace.findOne({ owner: req.user.id });
  if (existingWorkspace) {
    throw new ApiError(400, 'You already have a business profile. Please update it instead.');
  }

  const {
    name,
    email,
    phone,
    address,
    taxId,
    website,
    invoicePrefix,
    defaultCurrency,
    defaultPaymentTerms,
    defaultFooterNote,
    bankDetails,
  } = req.body;

  // Handle logo upload
  let logoData = {};
  if (req.file) {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'invoicely/logos',
            transformation: [
              { width: 500, height: 500, crop: 'limit' },
              { quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      logoData = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new ApiError(500, 'Failed to upload logo');
    }
  }

  // Create workspace
  const workspace = await Workspace.create({
    owner: req.user.id,
    name,
    email: email || req.user.email,
    phone,
    logo: logoData,
    address,
    taxId,
    website,
    invoicePrefix,
    defaultCurrency,
    defaultPaymentTerms,
    defaultFooterNote,
    bankDetails,
  });

  // Update user's active workspace
  await User.findByIdAndUpdate(req.user.id, {
    activeWorkspace: workspace._id,
  });

  res.status(201).json(
    new ApiResponse(201, { workspace }, 'Business profile created successfully')
  );
});

// @desc    Get business profile
// @route   GET /api/v1/business-profile
// @access  Private
const getBusinessProfile = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findOne({ owner: req.user.id });

  if (!workspace) {
    throw new ApiError(404, 'Business profile not found. Please create one.');
  }

  res.status(200).json(
    new ApiResponse(200, { workspace }, 'Business profile fetched successfully')
  );
});

// @desc    Update business profile
// @route   PUT /api/v1/business-profile
// @access  Private
const updateBusinessProfile = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  let workspace = await Workspace.findOne({ owner: req.user.id });

  if (!workspace) {
    throw new ApiError(404, 'Business profile not found');
  }

  const {
    name,
    email,
    phone,
    address,
    taxId,
    website,
    invoicePrefix,
    defaultCurrency,
    defaultPaymentTerms,
    defaultFooterNote,
    brandColors,
    bankDetails,
  } = req.body;

  // Handle logo upload
  if (req.file) {
    try {
      // Delete old logo if exists
      if (workspace.logo && workspace.logo.publicId) {
        await cloudinary.uploader.destroy(workspace.logo.publicId);
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'invoicely/logos',
            transformation: [
              { width: 500, height: 500, crop: 'limit' },
              { quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      workspace.logo = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new ApiError(500, 'Failed to upload logo');
    }
  }

  // Update fields
  if (name) workspace.name = name;
  if (email) workspace.email = email;
  if (phone !== undefined) workspace.phone = phone;
  if (address) workspace.address = { ...workspace.address, ...address };
  if (taxId !== undefined) workspace.taxId = taxId;
  if (website !== undefined) workspace.website = website;
  if (invoicePrefix) workspace.invoicePrefix = invoicePrefix;
  if (defaultCurrency) workspace.defaultCurrency = defaultCurrency;
  if (defaultPaymentTerms !== undefined) workspace.defaultPaymentTerms = defaultPaymentTerms;
  if (defaultFooterNote !== undefined) workspace.defaultFooterNote = defaultFooterNote;
  if (brandColors) workspace.brandColors = { ...workspace.brandColors, ...brandColors };
  if (bankDetails) workspace.bankDetails = { ...workspace.bankDetails, ...bankDetails };

  await workspace.save();

  res.status(200).json(
    new ApiResponse(200, { workspace }, 'Business profile updated successfully')
  );
});

// @desc    Delete logo
// @route   DELETE /api/v1/business-profile/logo
// @access  Private
const deleteLogo = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findOne({ owner: req.user.id });

  if (!workspace) {
    throw new ApiError(404, 'Business profile not found');
  }

  if (workspace.logo && workspace.logo.publicId) {
    await cloudinary.uploader.destroy(workspace.logo.publicId);
    workspace.logo = {};
    await workspace.save();
  }

  res.status(200).json(
    new ApiResponse(200, { workspace }, 'Logo deleted successfully')
  );
});

module.exports = {
  createBusinessProfile,
  getBusinessProfile,
  updateBusinessProfile,
  deleteLogo,
};