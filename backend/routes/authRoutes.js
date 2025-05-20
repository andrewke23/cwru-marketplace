// routes/authRoutes.js
// Defines API routes for authentication (register, login)

const express = require('express');
const router = express.Router();

// Import the authentication controller functions
// We will create authController.js next
const { registerUser, loginUser, verifyEmailMock } = require('../controllers/authController');

// --- Authentication Routes ---

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token (login)
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/verify-email-mock
// @desc    Mock email verification (for MVP)
// @access  Public
// In a real app, this would be a GET request with a token, e.g., /verify-email?token=xxx
// For simplicity in MVP, we might just have a simple endpoint or handle verification differently.
// Let's assume for now a mock verification endpoint if needed, or it's handled within register.
// router.get('/verify-email-mock', verifyEmailMock); // We can enable this if we build out the mock logic

module.exports = router;
