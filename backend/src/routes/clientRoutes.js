const express = require('express');
const router = express.Router();
const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getClientStats,
} = require('../controllers/clientController');
const {
  createClientValidator,
  updateClientValidator,
  getClientValidator,
  listClientsValidator,
} = require('../validators/clientValidator');
const { protect, requireWorkspace } = require('../middleware/auth');

// All routes require authentication and workspace
router.use(protect);
router.use(requireWorkspace);

// Stats route (before :id route to avoid conflict)
router.get('/stats', getClientStats);

// CRUD routes
router
  .route('/')
  .get(listClientsValidator, getClients)
  .post(createClientValidator, createClient);

router
  .route('/:id')
  .get(getClientValidator, getClient)
  .put(updateClientValidator, updateClient)
  .delete(getClientValidator, deleteClient);

module.exports = router;