const { body, param, query } = require('express-validator');

const createClientValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Client name is required')
    .isLength({ max: 100 })
    .withMessage('Client name cannot exceed 100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.zipCode').optional().trim(),
  body('address.country').optional().trim(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const updateClientValidator = [
  param('id').isMongoId().withMessage('Invalid client ID'),
  ...createClientValidator,
];

const getClientValidator = [
  param('id').isMongoId().withMessage('Invalid client ID'),
];

const listClientsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['name', 'email', 'createdAt', 'totalInvoiced'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

module.exports = {
  createClientValidator,
  updateClientValidator,
  getClientValidator,
  listClientsValidator,
};