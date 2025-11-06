const mongoose = require("mongoose");
const Report = require("../../models/Order/Reports.model.js");
const Order = require("../../models/Order/Order.model.js");
const { uploadToCloudinary } = require("../../middleware/upload.middleware");

const createDispute = async (req, res) => {
  try {
    const { orderId, reason, description, evidenceUrls } = req.body;

    // 1. Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ." });
    }

    // 2. Tìm đơn hàng
    const order = await Order.findById(orderId)
      .populate("renterId", "fullName email")
      .populate("ownerId", "fullName email");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    // 3. Kiểm tra trạng thái đơn hàng
    const allowedStatuses = ["progress", "returned", "completed"]; 
    if (!allowedStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        message: `Không thể tạo tranh chấp khi đơn hàng ở trạng thái "${order.orderStatus}"`,
      });
    }

    // 4. Kiểm tra quyền
    const userId = req.user._id.toString();
    const renterId = order.renterId._id.toString();
    const ownerId = order.ownerId._id.toString();

    if (userId !== renterId && userId !== ownerId) {
      return res.status(403).json({
        message: "Bạn không có quyền tạo tranh chấp cho đơn hàng này.",
      });
    }

    const reportedUserId = userId === renterId ? ownerId : renterId;

    // 5. Kiểm tra tranh chấp đang tồn tại
    const existing = await Report.findOne({
      orderId,
      type: "dispute",
      status: { $in: ["Pending", "Reviewed"] },
    });

    if (existing) {
      return res.status(400).json({
        message: "Đơn hàng này đã có tranh chấp đang được xử lý.",
      });
    }
    //upload images
     let evidence = [];
     if (req.files && req.files.length > 0) {
       const uploadedImages = await uploadToCloudinary(
         req.files,
         "retrotrade/disputes/"
       );
       evidence = uploadedImages.map((img) => img.Url);
     }

    // 6. Tạo Report
    const newReport = await Report.create({
      orderId,
      reporterId: userId,
      reportedUserId,
      reportedItemId: order.itemId,
      reason,
      description,
      evidence,
      type: "dispute",
      status: "Pending",
    });


    order.orderStatus = "disputed";
    order.disputeId = newReport._id; 
    await order.save();

    return res.status(201).json({
      code: 201,
      message: "Tạo tranh chấp thành công.",
      data: {
        _id: newReport._id,
        orderId: newReport.orderId,
        reporterId: newReport.reporterId,
        reportedUserId: newReport.reportedUserId,
        reason: newReport.reason,
        status: newReport.status,
        createdAt: newReport.createdAt,
        disputeId: newReport._id,
      },
    });
  } catch (error) {
    console.error("Error creating dispute:", error);
    return res.status(500).json({
      message: "Lỗi server khi tạo tranh chấp.",
      error: error.message,
    });
  }
};



const getAllDisputes = async (req, res) => {
  try {
    const { status, reporterId, orderId } = req.query;

    const query = { type: "dispute" };
    if (status) query.status = status;
    if (reporterId) query.reporterId = reporterId;
    if (orderId) query.orderId = orderId;

    const disputes = await Report.find(query)
      .populate("orderId", "orderGuid orderStatus totalAmount renterId ownerId")
      .populate("reporterId", "fullName email")
      .populate("reportedUserId", "fullName email")
      .populate("handledBy", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: disputes.length,
      data: disputes,
    });
  } catch (error) {
    console.error("Error getting disputes:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách tranh chấp.",
      error: error.message,
    });
  }
};

// Admin xem chi tiết tranh chấp
const getDisputeById = async (req, res) => {
  try {
    const dispute = await Report.findById(req.params.id)
      .populate("orderId", "orderGuid orderStatus totalAmount renterId ownerId")
      .populate("reporterId", "fullName email")
      .populate("reportedUserId", "fullName email")
      .populate("handledBy", "fullName email");

    if (!dispute) {
      return res.status(404).json({ message: "Không tìm thấy tranh chấp." });
    }

    const order = dispute.orderId;
    if (
      req.user.role !== "moderator" &&
      order?.renterId?.toString() !== req.user._id.toString() &&
      order?.ownerId?.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem tranh chấp này." });
    }

    res.status(200).json({ data: dispute });
  } catch (error) {
    console.error("Error fetching dispute:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy tranh chấp.",
      error: error.message,
    });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { decision, notes, refundAmount } = req.body;
    const dispute = await Report.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({ message: "Không tìm thấy tranh chấp." });
    }

    if (dispute.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Tranh chấp đã được xử lý hoặc đóng." });
    }

    dispute.status = "Resolved";
    dispute.resolution = {
      decision,
      notes,
      refundAmount,
    };
    dispute.handledBy = req.user._id;
    dispute.handledAt = new Date();
    await dispute.save();

    await Order.findByIdAndUpdate(dispute.orderId, {
      orderStatus: "completed",
      paymentStatus: refundAmount > 0 ? "refunded" : "paid",
    });

    res.status(200).json({
      message: "Đã xử lý tranh chấp thành công.",
      data: dispute,
    });
  } catch (error) {
    console.error("Error resolving dispute:", error);
    res.status(500).json({
      message: "Lỗi server khi xử lý tranh chấp.",
      error: error.message,
    });
  }
};

module.exports = {
  createDispute,
  getAllDisputes,
  getDisputeById,
  resolveDispute,
};
