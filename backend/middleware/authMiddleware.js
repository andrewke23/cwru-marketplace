// middleware/authMiddleware.js
// Middleware to protect routes by verifying JWT

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Protect routes by verifying JWT
//          If token is valid, it adds user info to req.user
const protect = async (req, res, next) => {
    let token;

    // Check if the Authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer TOKEN_STRING")
            token = req.headers.authorization.split(' ')[1];

            // Verify token using the JWT_SECRET from environment variables
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user in MongoDB using the ID from the token
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Add user info to request object (password is already excluded by the User model's toJSON transform)
            req.user = user;

            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, token failed verification' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            return res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };
