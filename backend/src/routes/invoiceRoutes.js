const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
} = require('../controllers/invoiceController');
const { getPublicInvoice } = require('../controllers/invoiceController');
const {
  createInvoiceValidator,
  updateInvoiceValidator,
  getInvoiceValidator,
  listInvoicesValidator,
} = require('../validators/invoiceValidator');
const { protect, requireWorkspace } = require('../middleware/auth');

router.use(protect);
router.use(requireWorkspace);

router.get('/stats', getInvoiceStats);

router
  .route('/')
  .get(listInvoicesValidator, getInvoices)
  .post(createInvoiceValidator, createInvoice);

router
  .route('/:id')
  .get(getInvoiceValidator, getInvoice)
  .put(updateInvoiceValidator, updateInvoice)
  .delete(getInvoiceValidator, deleteInvoice);
router.get('/public/:token', getPublicInvoice);

module.exports = router;