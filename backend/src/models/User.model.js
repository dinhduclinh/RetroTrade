const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userGuid: {
        type: String,
        default: () => require('crypto').randomUUID(),
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
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
        enum: ['user', 'owner', 'admin', 'moderator'],
        default: 'user'
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
    }],
    externalLogins: [{
        provider: String,
        providerKey: String,
        email: String,
        accessToken: String,
        refreshToken: String
    }]
}, {
    timestamps: true
});

userSchema.index({ reputationScore: -1 });

module.exports = mongoose.model('User', userSchema);