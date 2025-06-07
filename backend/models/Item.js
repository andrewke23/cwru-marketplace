const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    condition: {
        type: String,
        required: [true, 'Condition is required'],
        enum: {
            values: ['New', 'Like New', 'Excellent', 'Good', 'Fair'],
            message: 'Invalid condition value. Must be one of: New, Like New, Excellent, Good, Fair'
        }
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        lowercase: true,
        enum: ['textbooks', 'furniture', 'clothing', 'electronics', 'other']
    },
    imageUrl: {
        type: String,
        // Optional, can be null/undefined
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Seller ID is required']
    },
    sellerEmail: {
        type: String,
        required: [true, 'Seller email is required']
    },
    sellerName: {
        type: String,
        required: [true, 'Seller name is required']
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Index for faster queries
itemSchema.index({ sellerId: 1 });
itemSchema.index({ isArchived: 1 });
itemSchema.index({ category: 1 });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item; 