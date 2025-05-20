// middleware/authMiddleware.js
// Middleware to protect routes by verifying JWT

const jwt = require('jsonwebtoken');

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

            // --- Attach user to request object ---
            // Find the user by ID from the decoded token.
            // For MVP, we'll fetch from our global users array.
            // In a real app, you'd query your database here.
            const authenticatedUser = global.users.find(u => u.id === decoded.user.id);

            if (!authenticatedUser) {
                // This case might happen if a user was deleted after a token was issued.
                return res.status(401).json({ message: 'Not authorized, user not found.' });
            }

            // Exclude password from the user object attached to the request
            const { password, ...userWithoutPassword } = authenticatedUser;
            req.user = userWithoutPassword; // Add user object (without password) to the request

            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            console.error('Token verification failed:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, token failed verification.' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired.' });
            }
            // For other errors, pass to the global error handler
            next(error);
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided.' });
    }
};

module.exports = { protect };
