const Wallet = require("../../models/Wallet.model");
const WalletTransaction = require("../../models/WalletTransaction.model");
// view danh sách yêu cầu rút tiền
const getWithdrawalRequests = async (req, res) => {
    try {
        // Kiểm tra role admin
        if (req.user?.role !== 'admin' ) {
            return res.status(403).json({ message: "Không có quyền truy cập" });
        }

        const { status } = req.query; // pending, approved, rejected, completed

        const query = { typeId: "withdraw" };
        if (status) query.status = status;

        const requests = await WalletTransaction.find(query)
            .populate('walletId')
            .populate('bankAccountId')
            .populate({
                path: 'walletId',
                populate: { path: 'userId', select: 'fullName email phone' }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Lấy danh sách yêu cầu rút tiền thành công",
            data: requests,
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách rút tiền:", error);
        return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};
// Duyệt hoặc từ chối yêu cầu rút tiền (KHÔNG trừ tiền ví ở đây)
const reviewWithdrawalRequest = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const { transactionId } = req.params;
    const { action, adminNote } = req.body; // action: 'approve' | 'reject'

    const transaction = await WalletTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: "Giao dịch đã được xử lý trước đó" });
    }

    if (action === 'approve') {
      transaction.status = 'approved';
      transaction.adminNote = adminNote || 'Đã duyệt';
      transaction.reviewedBy = req.user._id;
      transaction.reviewedAt = new Date();
      await transaction.save();

      return res.status(200).json({
        message: "Đã duyệt yêu cầu rút tiền ",
        transaction,
      });
    } else if (action === 'reject') {
      transaction.status = 'rejected';
      transaction.adminNote = adminNote || 'Từ chối';
      transaction.reviewedBy = req.user._id;
      transaction.reviewedAt = new Date();
      await transaction.save();

      return res.status(200).json({
        message: "Đã từ chối yêu cầu rút tiền",
        transaction,
      });
    } else {
      return res.status(400).json({ message: "Action không hợp lệ" });
    }
  } catch (error) {
    console.error("Lỗi duyệt yêu cầu rút tiền:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Đánh dấu hoàn thành rút tiền (CHỈ TRỪ TIỀN ví ở đây)
const completeWithdrawal = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const { transactionId } = req.params;
    const { adminNote } = req.body;

    const transaction = await WalletTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }
    if (transaction.status !== 'approved') {
      return res.status(400).json({ message: "Giao dịch chưa được duyệt" });
    }

    const wallet = await Wallet.findById(transaction.walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Không tìm thấy ví" });
    }
    if (wallet.balance < transaction.amount) {
      return res.status(400).json({ message: "Số dư ví không đủ" });
    }
    wallet.balance -= transaction.amount;
    wallet.updatedAt = new Date();
    await wallet.save();

    transaction.status = 'completed';
    transaction.balanceAfter = wallet.balance;
    transaction.adminNote = (transaction.adminNote || '') + ' | Đã chuyển tiền: ' + (adminNote || '');
    await transaction.save();

    return res.status(200).json({
      message: " hoàn thành chuyển tiền",
      transaction,
    });
  } catch (error) {
    console.error("Lỗi đánh dấu hoàn thành:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// view tât cả giao dịch ví
const getAllWalletTransactions = async (req, res) => {
  try {
    if (req.user?.role !== 'admin')
      return res.status(403).json({ message: "Không có quyền truy cập" });

    const txs = await WalletTransaction.find()
      .populate({
        path: 'walletId',
        populate: { path: 'userId', select: 'fullName email phone' }
      })
      .populate('bankAccountId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy tất cả giao dịch ví thành công",
      data: txs,
    });
  } catch (error) {
    console.error("Lỗi lấy all giao dịch ví:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};



module.exports = {
    getWithdrawalRequests,
    reviewWithdrawalRequest,
    completeWithdrawal,
    getAllWalletTransactions,
};