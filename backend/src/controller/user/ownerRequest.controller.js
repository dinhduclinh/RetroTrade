const OwnerRequest = require("../../models/OwnerRequest.model");
const User = require("../../models/User.model");
const Notification = require("../../models/Notification.model");
const { createNotification } = require("../../utils/createNotification");

/**
 * Create a new owner request
 */
module.exports.createOwnerRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reason, additionalInfo, documents = [] } = req.body;

    if (!reason) {
      return res.json({
        code: 400,
        message: "Vui lòng cung cấp lý do yêu cầu",
      });
    }

    // Check if user already has a pending request
    const existingRequest = await OwnerRequest.findOne({
      user: userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.json({
        code: 400,
        message: "Bạn đã có yêu cầu đang chờ xử lý",
      });
    }

    // Get current user
    const currentUser = await User.findById(userId);
    
    // Only renter can request to become owner
    if (currentUser.role !== "renter") {
      return res.json({
        code: 400,
        message: "Chỉ người dùng với vai trò renter mới có thể yêu cầu quyền Owner",
      });
    }

    // Check if user has verified ID
    if (!currentUser.isIdVerified) {
      return res.json({
        code: 400,
        message: "Vui lòng xác minh danh tính trước khi yêu cầu quyền Owner",
      });
    }

    // Check if user has confirmed email
    if (!currentUser.isEmailConfirmed) {
      return res.json({
        code: 400,
        message: "Vui lòng xác minh email trước khi yêu cầu quyền Owner",
      });
    }

    const ownerRequest = await OwnerRequest.create({
      user: userId,
      status: "pending",
      reason,
      additionalInfo,
    });

    // Notify moderators only
    const moderators = await User.find({ role: "moderator" });
    for (const moderator of moderators) {
      await createNotification(
        moderator._id,
        "Owner Request",
        "Yêu cầu cấp quyền Owner mới",
        `Người dùng ${currentUser.fullName || currentUser.email} đã yêu cầu cấp quyền Owner.`,
        { requestId: ownerRequest._id, userId: userId }
      );
    }

    return res.json({
      code: 200,
      message: "Yêu cầu đã được gửi thành công",
      data: ownerRequest,
    });
  } catch (error) {
    console.error("Error creating owner request:", error);
    return res.json({
      code: 500,
      message: "Gửi yêu cầu thất bại",
      error: error.message,
    });
  }
};

/**
 * Get all owner requests (for admin/moderator)
 */
module.exports.getAllOwnerRequests = async (req, res) => {
  try {
    const { skip = 0, limit = 20 } = req.pagination || {};
    const { status } = req.query;

    let query = {};
    if (status) query.status = status;

    const [requests, totalItems] = await Promise.all([
      OwnerRequest.find(query)
        .populate("user", "email fullName avatarUrl role")
        .populate("reviewedBy", "email fullName")
        .sort({ CreatedAt: -1 })
        .skip(skip)
        .limit(limit),
      OwnerRequest.countDocuments(query),
    ]);

    return res.json({
      code: 200,
      message: "Lấy danh sách yêu cầu thành công",
      data: {
        items: requests,
        ...(res.paginationMeta ? res.paginationMeta(totalItems) : { totalItems }),
      },
    });
  } catch (error) {
    console.error("Error getting owner requests:", error);
    return res.json({
      code: 500,
      message: "Lấy danh sách yêu cầu thất bại",
      error: error.message,
    });
  }
};

/**
 * Get user's own requests
 */
module.exports.getMyOwnerRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await OwnerRequest.find({ user: userId })
      .populate("reviewedBy", "email fullName")
      .sort({ CreatedAt: -1 });

    return res.json({
      code: 200,
      message: "Lấy danh sách yêu cầu thành công",
      data: { items: requests },
    });
  } catch (error) {
    console.error("Error getting user's requests:", error);
    return res.json({
      code: 500,
      message: "Lấy danh sách yêu cầu thất bại",
      error: error.message,
    });
  }
};

/**
 * Get single request by ID
 */
module.exports.getOwnerRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await OwnerRequest.findById(id)
      .populate("user", "email fullName avatarUrl role phone bio")
      .populate("reviewedBy", "email fullName");

    if (!request) {
      return res.json({
        code: 404,
        message: "Không tìm thấy yêu cầu",
      });
    }

    return res.json({
      code: 200,
      message: "Lấy thông tin yêu cầu thành công",
      data: request,
    });
  } catch (error) {
    console.error("Error getting request:", error);
    return res.json({
      code: 500,
      message: "Lấy thông tin yêu cầu thất bại",
      error: error.message,
    });
  }
};

/**
 * Approve owner request
 */
module.exports.approveOwnerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user._id;
    const { notes } = req.body;

    const request = await OwnerRequest.findById(id).populate("user");
    if (!request) {
      return res.json({
        code: 404,
        message: "Không tìm thấy yêu cầu",
      });
    }

    if (request.status !== "pending") {
      return res.json({
        code: 400,
        message: "Yêu cầu đã được xử lý",
      });
    }

    // Update request status
    request.status = "approved";
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    if (notes) request.notes = notes;
    await request.save();

    // Update user role
    await User.findByIdAndUpdate(request.user._id, {
      role: "owner",
    });

    // Notify user
    await createNotification(
      request.user._id,
      "Owner Request Approved",
      "Yêu cầu cấp quyền Owner đã được duyệt",
      `Yêu cầu cấp quyền Owner của bạn đã được duyệt thành công. Bạn giờ đã có thể đăng sản phẩm cho thuê.`,
      { requestId: request._id }
    );

    return res.json({
      code: 200,
      message: "Yêu cầu đã được duyệt thành công",
      data: request,
    });
  } catch (error) {
    console.error("Error approving request:", error);
    return res.json({
      code: 500,
      message: "Duyệt yêu cầu thất bại",
      error: error.message,
    });
  }
};

/**
 * Reject owner request
 */
module.exports.rejectOwnerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user._id;
    const { rejectionReason, notes } = req.body;

    if (!rejectionReason) {
      return res.json({
        code: 400,
        message: "Vui lòng cung cấp lý do từ chối",
      });
    }

    const request = await OwnerRequest.findById(id).populate("user");
    if (!request) {
      return res.json({
        code: 404,
        message: "Không tìm thấy yêu cầu",
      });
    }

    if (request.status !== "pending") {
      return res.json({
        code: 400,
        message: "Yêu cầu đã được xử lý",
      });
    }

    // Update request status
    request.status = "rejected";
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason;
    if (notes) request.notes = notes;
    await request.save();

    // Notify user
    await createNotification(
      request.user._id,
      "Owner Request Rejected",
      "Yêu cầu cấp quyền Owner bị từ chối",
      `Yêu cầu cấp quyền Owner của bạn đã bị từ chối. Lý do: ${rejectionReason}`,
      { requestId: request._id }
    );

    return res.json({
      code: 200,
      message: "Yêu cầu đã bị từ chối",
      data: request,
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return res.json({
      code: 500,
      message: "Từ chối yêu cầu thất bại",
      error: error.message,
    });
  }
};

/**
 * Cancel owner request (by user)
 */
module.exports.cancelOwnerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await OwnerRequest.findById(id);
    if (!request) {
      return res.json({
        code: 404,
        message: "Không tìm thấy yêu cầu",
      });
    }

    if (request.user.toString() !== userId) {
      return res.json({
        code: 403,
        message: "Bạn không có quyền hủy yêu cầu này",
      });
    }

    if (request.status !== "pending") {
      return res.json({
        code: 400,
        message: "Chỉ có thể hủy yêu cầu đang chờ xử lý",
      });
    }

    request.status = "cancelled";
    await request.save();

    return res.json({
      code: 200,
      message: "Đã hủy yêu cầu thành công",
      data: request,
    });
  } catch (error) {
    console.error("Error cancelling request:", error);
    return res.json({
      code: 500,
      message: "Hủy yêu cầu thất bại",
      error: error.message,
    });
  }
};

/**
 * Get request statistics (for dashboard)
 */
module.exports.getOwnerRequestStats = async (req, res) => {
  try {
    const stats = await OwnerRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
    });

    return res.json({
      code: 200,
      message: "Lấy thống kê thành công",
      data: formattedStats,
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    return res.json({
      code: 500,
      message: "Lấy thống kê thất bại",
      error: error.message,
    });
  }
};

