const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  orderCode: { type: String, required: true, unique: true },
  paymentLinkId: { type: String, default: null, index: true },
  typeId: { type: String, required: true }, 
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  balanceAfter: { type: Number, default: null },
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
