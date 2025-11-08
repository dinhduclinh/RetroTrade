const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");
const loyaltyController = require("../../controller/loyalty/loyalty.controller");

/**
 * @route GET /api/v1/loyalty/stats
 * @desc Lấy thống kê RT Points của user
 * @access Private
 */
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const result = await loyaltyController.getLoyaltyStats(userId);

    if (result.success) {
      return res.json({
        code: 200,
        message: "Lấy thống kê RT Points thành công",
        data: result.data,
      });
    } else {
      return res.status(400).json({
        code: 400,
        message: result.error || "Không thể lấy thống kê RT Points",
      });
    }
  } catch (error) {
    console.error("Error getting loyalty stats:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi lấy thống kê RT Points",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/v1/loyalty/history
 * @desc Lấy lịch sử RT Points của user
 * @access Private
 */
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await loyaltyController.getLoyaltyHistory(userId, page, limit);

    if (result.success) {
      return res.json({
        code: 200,
        message: "Lấy lịch sử RT Points thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } else {
      return res.status(400).json({
        code: 400,
        message: result.error || "Không thể lấy lịch sử RT Points",
      });
    }
  } catch (error) {
    console.error("Error getting loyalty history:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi lấy lịch sử RT Points",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/v1/loyalty/claim-daily-login
 * @desc Nhận điểm đăng nhập hàng ngày
 * @access Private
 */
router.post("/claim-daily-login", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const result = await loyaltyController.addDailyLoginPoints(userId);

    if (result.success) {
      // Tạo thông báo khi nhận điểm thành công
      try {
        const { createNotification } = require("../../middleware/createNotification");
        if (result.transaction) {
          await createNotification(
            userId,
            "Loyalty",
            "Nhận RT Points thành công",
            `Bạn đã nhận ${result.transaction.points} RT Points cho đăng nhập hôm nay.`,
            { points: result.transaction.points, reason: "daily_login" }
          );
        }
      } catch (e) {
        console.error("Error sending loyalty notification:", e);
      }
      return res.json({
        code: 200,
        message: "Nhận điểm đăng nhập thành công",
        data: {
          points: result.transaction.points,
          balance: result.newBalance,
        },
      });
    } else if (result.alreadyClaimed) {
      return res.json({
        code: 200,
        message: result.message,
        alreadyClaimed: true,
      });
    } else {
      return res.status(400).json({
        code: 400,
        message: result.error || "Không thể nhận điểm đăng nhập",
      });
    }
  } catch (error) {
    console.error("Error claiming daily login points:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi nhận điểm đăng nhập",
      error: error.message,
    });
  }
});

module.exports = router;

