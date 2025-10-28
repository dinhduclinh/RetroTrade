const User = require("../../models/User.model");

/**
 * Get admin and moderator staff members
 * GET /api/v1/messages/staff
 */
module.exports.getStaff = async (req, res) => {
  try {
    const currentUserId = req.user._id; // User đang đăng nhập
    
    // Find users with admin or moderator role, excluding current user
    const staffMembers = await User.find({
      role: { $in: ['admin', 'moderator'] },
      isDeleted: false,
      isActive: true,
      _id: { $ne: currentUserId } // Exclude current user
    })
    .select('_id fullName email avatarUrl role userGuid')
    .limit(10); // Limit to 10 staff members

    return res.json({
      code: 200,
      message: "Lấy danh sách staff thành công",
      data: staffMembers
    });
  } catch (error) {
    console.error('Error getting staff:', error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi khi lấy danh sách staff",
      error: error.message
    });
  }
};

