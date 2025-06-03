const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/@case\.edu$/, 'Please use a valid CWRU email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    isVerified: {
        type: Boolean,
        default: true // For MVP, we're auto-verifying users
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true, // This will automatically update the updatedAt field
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            delete ret.password; // Don't send password in JSON responses
            return ret;
        }
    }
});

// Add any pre-save middleware here if needed
userSchema.pre('save', function(next) {
    if (this.isModified('email')) {
        // Ensure email is lowercase
        this.email = this.email.toLowerCase();
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User; 