const { body } = require('express-validator');

const businessProfileValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ max: 100 })
    .withMessage('Business name cannot exceed 100 characters'),
  body('email')
    .optional()
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
  body('taxId').optional().trim(),
  body('website').optional().trim().isURL().withMessage('Please enter a valid URL'),
  body('invoicePrefix')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Invoice prefix cannot exceed 10 characters'),
  body('defaultCurrency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('defaultPaymentTerms')
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage('Payment terms must be between 0 and 365 days'),
];

module.exports = {
  businessProfileValidator,
};