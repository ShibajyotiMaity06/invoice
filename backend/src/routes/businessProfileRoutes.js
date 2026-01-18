const express = require('express');
const router = express.Router();
const {
  createBusinessProfile,
  getBusinessProfile,
  updateBusinessProfile,
  deleteLogo,
} = require('../controllers/businessProfileController');
const { businessProfileValidator } = require('../validators/businessProfileValidator');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect); // All routes require authentication

router
  .route('/')
  .get(getBusinessProfile)
  .post(upload.single('logo'), businessProfileValidator, createBusinessProfile)
  .put(upload.single('logo'), businessProfileValidator, updateBusinessProfile);

router.delete('/logo', deleteLogo);

module.exports = router;