const { validationResult } = require('express-validator');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// @desc    Register user
// @route   POST /api/v1/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User already exists with this email');
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
  });

  // Generate token
  const token = user.generateAuthToken();

  // Set cookie
  res.cookie('token', token, cookieOptions);

  res.status(201).json(
    new ApiResponse(201, {
      user: user.toPublicJSON(),
      token,
    }, 'User registered successfully')
  );
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation Error', errors.array());
  }

  const { email, password } = req.body;

  // Find user and include password
  const user = await User.findOne({ email }).select('+password').populate('activeWorkspace');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate token
  const token = user.generateAuthToken();

  // Set cookie
  res.cookie('token', token, cookieOptions);

  res.status(200).json(
    new ApiResponse(200, {
      user: user.toPublicJSON(),
      token,
    }, 'Login successful')
  );
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    ...cookieOptions,
    expires: new Date(0),
  });

  res.status(200).json(
    new ApiResponse(200, null, 'Logged out successfully')
  );
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('activeWorkspace');

  res.status(200).json(
    new ApiResponse(200, {
      user: user.toPublicJSON(),
      workspace: user.activeWorkspace || null,
    }, 'User fetched successfully')
  );
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { firstName, lastName },
    { new: true, runValidators: true }
  ).populate('activeWorkspace');

  res.status(200).json(
    new ApiResponse(200, {
      user: user.toPublicJSON(),
    }, 'Profile updated successfully')
  );
});

module.exports = {
  signup,
  login,
  logout,
  getMe,
  updateMe,
};