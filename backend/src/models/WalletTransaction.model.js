const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  orderCode: { type: String, required: true, unique: true },
  typeId: { type: String, required: true }, 
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, default: null },
  note: { type: String },
  payUrl: { type: String, default: null },       // Thêm trường payUrl
  qrCode: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
