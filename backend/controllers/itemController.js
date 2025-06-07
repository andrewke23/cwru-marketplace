// controllers/itemController.js
// Handles the business logic for item management, now with archive functionality

const Item = require('../models/Item');

// Create a new item
const createItem = async (req, res) => {
    try {
        const { name, description, price, category, condition } = req.body;
        let imageUrl = req.body.imageUrl;

        // If a file was uploaded, use its path
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const item = await Item.create({
            name,
            description,
            price: parseFloat(price),
            category,
            condition,
            imageUrl,
            sellerId: req.user.id,
            sellerEmail: req.user.email,
            sellerName: req.user.fullName
        });

        res.status(201).json({
            message: 'Item created successfully',
            item
        });
    } catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ message: 'Error creating item' });
    }
};

// Get all active items (with optional search/filter)
const getAllItems = async (req, res) => {
    try {
        const { search, category } = req.query;
        const query = { isArchived: false };

        // Add category filter if provided
        if (category) {
            query.category = category.toLowerCase();
        }

        // Add search filter if provided
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        const items = await Item.find(query).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ message: 'Error fetching items' });
    }
};

// Get item by ID
const getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ message: 'Error fetching item' });
    }
};

// Get items by user ID
const getItemsByUserId = async (req, res) => {
    try {
        const items = await Item.find({ sellerId: req.params.userId })
            .sort({ isArchived: 1, createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Get user items error:', error);
        res.status(500).json({ message: 'Error fetching user items' });
    }
};

// Update item
const updateItem = async (req, res) => {
    try {
        const { name, description, price, category, condition } = req.body;
        let imageUrl = req.body.imageUrl;

        const item = await Item.findById(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Verify ownership
        if (item.sellerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this item' });
        }

        // Update fields
        item.name = name;
        item.description = description;
        item.price = parseFloat(price);
        item.category = category;
        item.condition = condition;

        // Only update image if a new file is uploaded or a new URL is explicitly provided
        if (req.file) {
            item.imageUrl = `/uploads/${req.file.filename}`;
        } else if (imageUrl !== undefined && imageUrl !== null && imageUrl !== '') {
            // Only update imageUrl if it's explicitly provided and not empty
            item.imageUrl = imageUrl;
        }
        // If neither a new file nor a new URL is provided, keep the existing image

        await item.save();

        res.json({
            message: 'Item updated successfully',
            item
        });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ message: 'Error updating item' });
    }
};

// Toggle archive status
const toggleArchiveStatus = async (req, res) => {
    try {
        const item = await Item.findById(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Verify ownership
        if (item.sellerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to archive this item' });
        }

        // Toggle archive status
        item.isArchived = !item.isArchived;
        item.archivedAt = item.isArchived ? new Date() : null;

        await item.save();

        res.json({
            message: `Item ${item.isArchived ? 'archived' : 'unarchived'} successfully`,
            item
        });
    } catch (error) {
        console.error('Toggle archive error:', error);
        res.status(500).json({ message: 'Error toggling archive status' });
    }
};

module.exports = {
    getAllItems,
    getItemById,
    getItemsByUserId,
    createItem,
    updateItem,
    toggleArchiveStatus
};
