// routes/itemRoutes.js
// Defines API routes for managing items, now with archive functionality

const express = require('express');
const router = express.Router();
const multer = require('multer'); // For handling file uploads
const path = require('path'); // For working with file paths

// Import the item controller functions
const {
    getAllItems,
    getItemById,
    createItem,
    getItemsByUserId,
    updateItem, 
    toggleArchiveStatus // Changed from deleteItem
} = require('../controllers/itemController');

// Import the authentication middleware
const { protect } = require('../middleware/authMiddleware');

// --- Multer Configuration for File Uploads (same as before) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: function (req, file, cb) {
        // Create a unique filename: fieldname-timestamp.extension
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// File filter to accept only images (same as before)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes), false);
};

// Initialize Multer upload middleware (same as before)
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    fileFilter: fileFilter
});


// --- Item Routes ---

// GET all items (public, shows only non-archived items due to controller logic)
router.get('/', getAllItems);

// GET items by a specific user (shows all items for that user, frontend differentiates)
router.get('/user/:userId', getItemsByUserId);

// GET a single item by its ID (can show archived items, frontend indicates status)
router.get('/:itemId', getItemById);

// POST to create a new item
// Requires authentication, handles optional file upload
router.post('/', protect, upload.single('itemImageFile'), createItem);

// PUT to update an existing item by ID
// Requires authentication, user must own the item, handles optional file upload
router.put('/:itemId', protect, upload.single('itemImageFile'), updateItem);

// PUT to toggle archive status of an item by ID
// Requires authentication, user must own the item
router.put('/:itemId/toggle-archive', protect, toggleArchiveStatus); // THIS IS THE CHANGED ROUTE

module.exports = router;
