const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userGuid: {
        type: String,
        default: () => require('crypto').randomUUID(),
        unique: true
    },
    email: {
        type: String,
        required: false, 
        unique: true,
        sparse: true, 
        lowercase: true,
        trim: true
    },
    phone: String,
    passwordHash: String,
    passwordSalt: String,
    fullName: String,
    displayName: String,
    avatarUrl: String,
    bio: String,
    isEmailConfirmed: { type: Boolean, default: false },
    isPhoneConfirmed: { type: Boolean, default: false },
    isIdVerified: { type: Boolean, default: false },
    reputationScore: { type: Number, default: 0, min: 0, max: 5 },
    points: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    lastLoginAt: Date,
    role: {
        type: String,
        enum: ['renter', 'owner', 'admin', 'moderator'],
        default: 'renter'
    },
    wallet: {
        currency: { type: String, default: 'VND' },
        balance: { type: Number, default: 0 }
    },
    documents: [{
        documentType: String,
        documentNumber: String,
        fileUrl: String,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        submittedAt: { type: Date, default: Date.now },
        reviewedAt: Date,
        rejectionReason: String
    }]
}, {
    timestamps: true
});

userSchema.index({ reputationScore: -1 });


userSchema.index({ phone: 1, email: 1 }, { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { 
        $or: [
            { phone: { $exists: true, $ne: null } },
            { email: { $exists: true, $ne: null } }
        ]
    }
});


userSchema.pre('save', function(next) {
    if (!this.email && !this.phone) {
        return next(new Error('User must have either email or phone number'));
    }
    next();
});

module.exports = mongoose.model('User', userSchema);