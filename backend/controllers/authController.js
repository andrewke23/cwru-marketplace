// controllers/authController.js
// Handles the business logic for user authentication

const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For generating JSON Web Tokens

// --- In-Memory Data (from server.js for MVP) ---
// In a real app, you'd interact with a database model here.
// We are accessing the global arrays defined in server.js
// const users = global.users; // (already available via global)
// const nextUserId = global.nextUserId; // (already available via global)


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

        // --- Basic Input Validation ---
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Please provide full name, email, and password.' });
        }

        // --- CWRU Email Validation ---
        if (!email.toLowerCase().endsWith('@case.edu')) {
            return res.status(400).json({ message: 'Registration requires a CWRU email address (ending with @case.edu).' });
        }

        // --- Check if user already exists ---
        const existingUser = global.users.find(user => user.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // --- Hash Password ---
        const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

        // --- Create New User Object (MVP: auto-verified) ---
        const newUser = {
            id: global.nextUserId++,
            fullName,
            email: email.toLowerCase(), // Store email in lowercase for consistency
            password: hashedPassword,
            isVerified: true, // For MVP, we'll auto-verify. Real app needs email verification step.
            createdAt: new Date().toISOString()
        };

        global.users.push(newUser);

        // --- Respond (excluding password) ---
        // For MVP, we can directly log them in by sending a token, or just a success message.
        // Let's send a success message for now. Login can be a separate step.
        res.status(201).json({
            message: 'User registered successfully! Please log in.',
            userId: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName
        });

    } catch (error) {
        console.error('Error in registerUser:', error);
        // Pass error to the global error handler in server.js
        next(error);
    }
};


// @desc    Authenticate user and get token (login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // --- Basic Input Validation ---
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }

        // --- Find User by Email ---
        const user = global.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials (email not found).' });
        }

        // --- Check if User is Verified (if implementing that step strictly) ---
        // if (!user.isVerified) {
        //     return res.status(401).json({ message: 'Please verify your email before logging in.' });
        // }

        // --- Compare Password ---
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials (password incorrect).' });
        }

        // --- User Matched: Create JWT Payload ---
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
                // Add any other user details you want in the token, but keep it light
            }
        };

        // --- Sign the Token ---
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token expiration (e.g., 1 hour, 1 day: '1d')
            (err, token) => {
                if (err) throw err; // This will be caught by the outer try-catch
                res.status(200).json({
                    message: 'Login successful!',
                    token,
                    user: { // Send back some user info (excluding password)
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName
                    }
                });
            }
        );

    } catch (error) {
        console.error('Error in loginUser:', error);
        next(error); // Pass error to the global error handler
    }
};

// (Optional for MVP) Mock Email Verification function
// const verifyEmailMock = (req, res, next) => {
//     // Logic for a mock email verification if you want to implement a separate step
//     res.status(200).json({ message: "Email verification mock endpoint hit." });
// };


module.exports = {
    registerUser,
    loginUser,
    // verifyEmailMock // Uncomment if you implement it
};
