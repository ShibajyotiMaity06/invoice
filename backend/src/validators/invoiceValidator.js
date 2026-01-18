const { body, param, query } = require('express-validator');

const lineItemValidator = [
  body('lineItems')
    .isArray({ min: 1 })
    .withMessage('At least one line item is required'),
  body('lineItems.*.description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('lineItems.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('lineItems.*.rate')
    .isFloat({ min: 0 })
    .withMessage('Rate must be 0 or greater'),
  body('lineItems.*.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
];

const createInvoiceValidator = [
  body('clientId')
    .isMongoId()
    .withMessage('Valid client ID is required'),
  body('issueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid issue date'),
  body('dueDate')
    .isISO8601()
    .withMessage('Valid due date is required'),
  ...lineItemValidator,
  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be percentage or fixed'),
  body('discountValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be 0 or greater'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
];

const updateInvoiceValidator = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  body('clientId')
    .optional()
    .isMongoId()
    .withMessage('Valid client ID is required'),
  body('issueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid issue date'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('lineItems')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one line item is required'),
  body('lineItems.*.description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('lineItems.*.quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('lineItems.*.rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rate must be 0 or greater'),
];

const getInvoiceValidator = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),
];

const listInvoicesValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']),
  query('clientId').optional().isMongoId(),
];

module.exports = {
  createInvoiceValidator,
  updateInvoiceValidator,
  getInvoiceValidator,
  listInvoicesValidator,
};