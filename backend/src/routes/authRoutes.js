const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getMe,
  updateMe,
} = require('../controllers/authController');
const { signupValidator, loginValidator } = require('../validators/authValidator');
const { protect } = require('../middleware/auth');

router.post('/signup', signupValidator, signup);
router.post('/login', loginValidator, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;