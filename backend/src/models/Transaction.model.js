const mongoose = require('mongoose');

const transactionSchema = new Schema({
    transactionGuid: {
        type: String,
        default: () => require('crypto').randomUUID(),
        unique: true
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['payment', 'refund', 'deposit', 'withdrawal', 'fee', 'reward'],
        required: true
    },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    provider: String,
    providerTransactionId: String,
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    metadata: Schema.Types.Mixed,
    balanceAfter: Number
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);