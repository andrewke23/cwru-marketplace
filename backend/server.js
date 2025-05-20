// server.js
// Main entry point for the CWRU Marketplace backend

// Import necessary modules
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // Core Node.js module for working with file paths

// Load environment variables from .env file
dotenv.config();

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');

// Initialize the Express application
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Serve Static Files for Uploaded Images ---
// This makes files in the 'uploads' directory accessible via URLs
// e.g., http://localhost:5000/uploads/imagefilename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(`Serving static files from: ${path.join(__dirname, 'uploads')}`);


// --- In-Memory Data Storage (for MVP) ---
global.users = [];
global.items = [];
global.nextUserId = 1;
global.nextItemId = 1;

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// --- Basic Welcome Route ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the CWRU Marketplace API! Image uploads enabled.' });
});

// --- Error Handling Middleware (Basic) ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Multer error handling (optional, for more specific messages)
    if (err instanceof multer.MulterError) { // Make sure multer is imported if you use this here
        return res.status(400).json({ message: err.message });
    }
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected error occurred.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Current NODE_ENV: ${process.env.NODE_ENV || 'development (default)'}`);
});

module.exports = app;
