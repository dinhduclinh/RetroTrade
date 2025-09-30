const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemGuid: {
        type: String,
        default: () => require('crypto').randomUUID(),
        unique: true
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 300 },
    shortDescription: { type: String, maxlength: 1000 },
    description: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    condition: {
        type: String,
        enum: ['new', 'like_new', 'good', 'fair', 'poor']
    },
    basePrice: { type: Number, required: true, min: 0 },
    priceUnit: {
        type: String,
        enum: ['hour', 'day', 'week', 'month'],
        default: 'day'
    },
    depositAmount: { type: Number, default: 0, min: 0 },
    minRentalDuration: Number,
    maxRentalDuration: Number,
    currency: { type: String, default: 'VND' },
    quantity: { type: Number, default: 1, min: 0 },
    availableQuantity: { type: Number, default: 1, min: 0 },
    status: {
        type: String,
        enum: ['available', 'rented', 'maintenance', 'unavailable'],
        default: 'available'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        }
    },
    address: String,
    city: String,
    district: String,
    images: [{
        url: String,
        isPrimary: { type: Boolean, default: false },
        ordinal: Number,
        altText: String
    }],
    tags: [String],
    isHighlighted: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },
    rentCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

itemSchema.index({ ownerId: 1 });
itemSchema.index({ categoryId: 1, status: 1 });
itemSchema.index({ location: '2dsphere' });
itemSchema.index({ city: 1, district: 1 });
itemSchema.index({ status: 1, availableQuantity: 1 });
itemSchema.index({ basePrice: 1, rentCount: -1 });
itemSchema.index({ tags: 1 });
itemSchema.index({ title: 'text', shortDescription: 'text', description: 'text' });

module.exports = mongoose.model('Item', itemSchema);