const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userId2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

conversationSchema.index(
    { userId1: 1, userId2: 1 },
    { unique: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
