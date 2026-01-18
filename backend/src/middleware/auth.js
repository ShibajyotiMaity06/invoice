const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in cookies first, then Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).populate('activeWorkspace');

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired');
    }
    throw error;
  }
});

// Check subscription plan access
const requirePlan = (...plans) => {
  return (req, res, next) => {
    if (!plans.includes(req.user.plan)) {
      throw new ApiError(
        403,
        `This feature requires one of the following plans: ${plans.join(', ')}`
      );
    }
    next();
  };
};

// Check if user has workspace
const requireWorkspace = asyncHandler(async (req, res, next) => {
  if (!req.user.activeWorkspace) {
    throw new ApiError(400, 'Please set up your business profile first');
  }
  req.workspace = req.user.activeWorkspace;
  next();
});

module.exports = { protect, requirePlan, requireWorkspace };