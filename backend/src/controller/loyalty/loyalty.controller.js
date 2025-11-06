const mongoose = require("mongoose");
const { Types } = mongoose;
const User = require("../../models/User.model");
const LoyaltyPointTransaction = require("../../models/LoyaltyPointTransaction.model");

/**
 * Thêm RT Points cho user
 * @param {string} userId - User ID
 * @param {number} points - Số điểm
 * @param {string} type - Loại transaction
 * @param {string} description - Mô tả
 * @param {object} options - Options: orderId, expiresAt, metadata
 * @returns {Promise<{success: boolean, transaction?: object, error?: string}>}
 */
async function addPoints(userId, points, type, description, options = {}) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Lấy user và cập nhật points
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return { success: false, error: "User not found" };
    }

    const newBalance = (user.points || 0) + points;

    // Tạo transaction record
    const transaction = await LoyaltyPointTransaction.create(
      [
        {
          userId,
          points,
          balance: newBalance,
          type,
          description,
          orderId: options.orderId,
          expiresAt: options.expiresAt,
          metadata: options.metadata || {},
        },
      ],
      { session }
    );

    // Cập nhật user points
    await User.findByIdAndUpdate(
      userId,
      { points: newBalance },
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      transaction: transaction[0],
      newBalance,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error adding loyalty points:", error);
    return { success: false, error: error.message };
  } finally {
    session.endSession();
  }
}

/**
 * Cộng điểm khi đăng nhập hàng ngày
 */
async function addDailyLoginPoints(userId) {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  // Kiểm tra xem đã cộng điểm hôm nay chưa
  const todayTransaction = await LoyaltyPointTransaction.findOne({
    userId,
    type: "daily_login",
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  if (todayTransaction) {
    return {
      success: false,
      alreadyClaimed: true,
      message: "Đã nhận điểm đăng nhập hôm nay",
    };
  }

  // Cộng 10 RT Points cho đăng nhập hàng ngày
  const result = await addPoints(
    userId,
    10,
    "daily_login",
    "Đăng nhập hàng ngày - +10 RT Points",
    {
      expiresAt: null, // Không hết hạn
    }
  );

  return result;
}

/**
 * Cộng điểm khi đặt hàng thành công
 */
async function addOrderPoints(userId, orderId, orderAmount) {
  // Tính điểm: 1 RT Point cho mỗi 10,000 VND (làm tròn)
  const points = Math.floor(orderAmount / 10000);

  if (points <= 0) {
    return {
      success: false,
      message: "Đơn hàng quá nhỏ để nhận điểm",
    };
  }

  const result = await addPoints(
    userId,
    points,
    "order_completed",
    `Đặt hàng thành công - +${points} RT Points (${orderAmount.toLocaleString("vi-VN")}₫)`,
    {
      orderId,
      expiresAt: null, // Không hết hạn
    }
  );

  return result;
}

/**
 * Lấy lịch sử RT Points của user
 */
async function getLoyaltyHistory(userId, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      LoyaltyPointTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoyaltyPointTransaction.countDocuments({ userId }),
    ]);

    return {
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error getting loyalty history:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Lấy thống kê RT Points của user
 */
async function getLoyaltyStats(userId) {
  try {
    const user = await User.findById(userId).select("points").lean();
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const [totalEarned, totalSpent] = await Promise.all([
      LoyaltyPointTransaction.aggregate([
        { $match: { userId: new Types.ObjectId(userId), points: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$points" } } },
      ]),
      LoyaltyPointTransaction.aggregate([
        { $match: { userId: new Types.ObjectId(userId), points: { $lt: 0 } } },
        { $group: { _id: null, total: { $sum: "$points" } } },
      ]),
    ]);

    const totalEarnedPoints = totalEarned[0]?.total || 0;
    const totalSpentPoints = Math.abs(totalSpent[0]?.total || 0);

    return {
      success: true,
      data: {
        currentBalance: user.points || 0,
        totalEarned: totalEarnedPoints,
        totalSpent: totalSpentPoints,
      },
    };
  } catch (error) {
    console.error("Error getting loyalty stats:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  addPoints,
  addDailyLoginPoints,
  addOrderPoints,
  getLoyaltyHistory,
  getLoyaltyStats,
};

