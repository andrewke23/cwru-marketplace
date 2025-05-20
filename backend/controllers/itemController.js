// controllers/itemController.js
// Handles the business logic for item management, now with archive functionality

// (Keep existing getAllItems, getItemById, getItemsByUserId, createItem, updateItem functions here)
// ...

const getAllItems = async (req, res, next) => {
    try {
        const { search, category } = req.query;
        // Filter out archived items for the public view
        let activeItems = global.items.filter(item => !item.isArchived); 
        let filteredItems = [...activeItems]; // Work with a copy of active items

        if (search) {
            const searchTerm = search.toLowerCase();
            filteredItems = filteredItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm)
            );
        }

        if (category) {
            const categoryTerm = category.toLowerCase();
            filteredItems = filteredItems.filter(item =>
                item.category.toLowerCase() === categoryTerm
            );
        }
        res.status(200).json(filteredItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
        console.error('Error in getAllItems:', error);
        next(error);
    }
};

const getItemById = async (req, res, next) => {
    try {
        const itemId = parseInt(req.params.itemId);
        const item = global.items.find(i => i.id === itemId);

        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        // For item details, we can show it even if archived,
        // the frontend can indicate its status.
        res.status(200).json(item);
    } catch (error) {
        console.error('Error in getItemById:', error);
        next(error);
    }
};

const getItemsByUserId = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        // Returns all items for the user, including archived ones.
        // Frontend will differentiate.
        const userItems = global.items.filter(item => item.sellerId === userId);
        res.status(200).json(userItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
        console.error('Error in getItemsByUserId:', error);
        next(error);
    }
};

const createItem = async (req, res, next) => {
    try {
        const { name, description, price, category } = req.body;
        let imageUrlFromBody = req.body.imageUrl; 

        if (!name || !description || price === undefined || !category) {
            return res.status(400).json({ message: 'Please provide name, description, price, and category.' });
        }
        if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
        }

        const seller = req.user;
        if (!seller) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        let finalImageUrl = `https://placehold.co/400x300/e2e8f0/cbd5e0?text=${encodeURIComponent(name)}`; 

        if (req.file) {
            finalImageUrl = `/uploads/${req.file.filename}`;
        } else if (imageUrlFromBody && typeof imageUrlFromBody === 'string' && imageUrlFromBody.trim() !== '') {
            finalImageUrl = imageUrlFromBody.trim();
        }

        const newItem = {
            id: global.nextItemId++,
            name,
            description,
            price: parseFloat(price),
            category: category.toLowerCase(),
            imageUrl: finalImageUrl,
            sellerId: seller.id,
            sellerEmail: seller.email,
            sellerName: seller.fullName,
            isArchived: false, // New field, defaults to false
            archivedAt: null,  // New field
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString() 
        };
        global.items.push(newItem);
        res.status(201).json({ message: 'Item created successfully!', item: newItem });
    } catch (error) {
        console.error('Error in createItem:', error);
        // Note: `multer` is not directly available here unless imported.
        // The error handling in server.js or route-specific multer error handler is better.
        if (error.code === 'LIMIT_FILE_SIZE' || (error.message && error.message.includes('File upload only supports'))) { 
             return res.status(400).json({ message: error.message || "Image upload error." });
        }
        next(error);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const itemId = parseInt(req.params.itemId);
        const itemIndex = global.items.findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        let itemToUpdate = global.items[itemIndex];

        if (itemToUpdate.sellerId !== req.user.id) {
            return res.status(403).json({ message: 'User not authorized to update this item.' });
        }
        // Cannot edit an archived item directly, user must unarchive first (optional rule, for now allow edit)
        // if (itemToUpdate.isArchived) {
        //     return res.status(400).json({ message: 'Cannot edit an archived item. Please unarchive it first.' });
        // }


        const { name, description, price, category } = req.body;
        let imageUrlFromBody = req.body.imageUrl; 

        if (name) itemToUpdate.name = name;
        if (description) itemToUpdate.description = description;
        if (price !== undefined) {
            const parsedPrice = parseFloat(price);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
            }
            itemToUpdate.price = parsedPrice;
        }
        if (category) itemToUpdate.category = category.toLowerCase();

        if (req.file) {
            itemToUpdate.imageUrl = `/uploads/${req.file.filename}`;
        } else if (imageUrlFromBody && typeof imageUrlFromBody === 'string') {
            if (imageUrlFromBody.trim() === '' && itemToUpdate.imageUrl !== `https://placehold.co/400x300/e2e8f0/cbd5e0?text=${encodeURIComponent(itemToUpdate.name)}`) {
                 itemToUpdate.imageUrl = `https://placehold.co/400x300/e2e8f0/cbd5e0?text=${encodeURIComponent(itemToUpdate.name)}`;
            } else if (imageUrlFromBody.trim() !== '' && itemToUpdate.imageUrl !== imageUrlFromBody.trim()) {
                itemToUpdate.imageUrl = imageUrlFromBody.trim();
            }
        }
        
        itemToUpdate.updatedAt = new Date().toISOString();
        global.items[itemIndex] = itemToUpdate; 

        res.status(200).json({
            message: 'Item updated successfully!',
            item: itemToUpdate
        });

    } catch (error) {
        console.error('Error in updateItem:', error);
         if (error.code === 'LIMIT_FILE_SIZE' || (error.message && error.message.includes('File upload only supports'))) { 
             return res.status(400).json({ message: error.message || "Image upload error during update." });
        }
        next(error);
    }
};

// @desc    Toggle archive status of an item
// @route   PUT /api/items/:itemId/toggle-archive
// @access  Private (Owner only)
const toggleArchiveStatus = async (req, res, next) => {
    try {
        const itemId = parseInt(req.params.itemId);
        const itemIndex = global.items.findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        const itemToToggle = global.items[itemIndex];

        // Check ownership
        if (itemToToggle.sellerId !== req.user.id) {
            return res.status(403).json({ message: 'User not authorized to modify this item.' });
        }

        // Toggle archive status
        itemToToggle.isArchived = !itemToToggle.isArchived;
        itemToToggle.archivedAt = itemToToggle.isArchived ? new Date().toISOString() : null;
        itemToToggle.updatedAt = new Date().toISOString();

        global.items[itemIndex] = itemToToggle;

        const message = itemToToggle.isArchived ? 'Item archived successfully.' : 'Item unarchived successfully.';
        res.status(200).json({ message, item: itemToToggle });

    } catch (error) {
        console.error('Error in toggleArchiveStatus:', error);
        next(error);
    }
};


module.exports = {
    getAllItems,
    getItemById,
    getItemsByUserId,
    createItem,
    updateItem,
    toggleArchiveStatus // Changed from deleteItem
};
