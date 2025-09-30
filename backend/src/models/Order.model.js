const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderGuid: {
        type: String,
        default: () => require('crypto').randomUUID(),
        unique: true
    },
    renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    itemSnapshot: {
        title: String,
        images: [String],
        basePrice: Number,
        priceUnit: String
    },
    unitCount: { type: Number, default: 1, min: 1 },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0 },
    currency: { type: String, default: 'VND' },
    paymentStatus: {
        type: String,
        enum: ['not_paid', 'partial', 'paid', 'refunded', 'failed'],
        default: 'not_paid'
    },
    orderStatus: {
        type: String,
        enum: ['pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'],
        default: 'pending_payment'
    },
    contract: {
        content: String,
        filePath: String,
        isSigned: { type: Boolean, default: false },
        signatures: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            signatureData: String,
            signedAt: Date,
            isValid: { type: Boolean, default: true }
        }]
    },
    reviews: [{
        fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        isVisible: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }],
    cancelReason: String
}, {
    timestamps: true
});

orderSchema.index({ renterId: 1, createdAt: -1 });
orderSchema.index({ ownerId: 1, createdAt: -1 });
orderSchema.index({ itemId: 1, orderStatus: 1 });
orderSchema.index({ startAt: 1, endAt: 1 });

module.exports = mongoose.model('Order', orderSchema);