const mongoose = require("mongoose");
const Report = require("../../models/Order/Reports.model.js");
const Order = require("../../models/Order/Order.model.js");
const { uploadToCloudinary } = require("../../middleware/upload.middleware");

const createDispute = async (req, res) => {
  try {
    const { orderId, reason, description, evidenceUrls } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ." });
    }

    const order = await Order.findById(orderId)
      .populate("renterId", "fullName email")
      .populate("ownerId", "fullName email");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const allowedStatuses = ["progress", "returned", "completed"]; 
    if (!allowedStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        message: `Không thể tạo tranh chấp khi đơn hàng ở trạng thái "${order.orderStatus}"`,
      });
    }

    const userId = req.user._id.toString();
    const renterId = order.renterId._id.toString();
    const ownerId = order.ownerId._id.toString();

    if (userId !== renterId && userId !== ownerId) {
      return res.status(403).json({
        message: "Bạn không có quyền tạo tranh chấp cho đơn hàng này.",
      });
    }

    const reportedUserId = userId === renterId ? ownerId : renterId;

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
     let evidence = [];
     if (req.files && req.files.length > 0) {
       const uploadedImages = await uploadToCloudinary(
         req.files,
         "retrotrade/disputes/"
       );
       evidence = uploadedImages.map((img) => img.Url);
     }

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


const getDisputeById = async (req, res) => {
  try {
    const dispute = await Report.findById(req.params.id)
      .populate("orderId")
      .populate("reporterId", "fullName email avatarUrl")
      .populate("reportedUserId", "fullName email avatarUrl")
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { decision, notes, refundAmount = 0 } = req.body;
    const disputeId = req.params.id;

    // 1. KIỂM TRA QUYỀN
    if (!["admin", "moderator"].includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền xử lý tranh chấp." });
    }

  
    const validDecisions = ["refund_full", "refund_partial", "reject", "keep_for_seller"];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        message: "Quyết định không hợp lệ. Chỉ chấp nhận: " + validDecisions.join(", "),
      });
    }

    if (refundAmount < 0) {
      return res.status(400).json({ message: "Số tiền hoàn không được âm." });
    }

    if (notes && notes.length > 1000) {
      return res.status(400).json({ message: "Ghi chú không được quá 1000 ký tự." });
    }

    //  LẤY DISPUTE + ORDER (atomic)
    const dispute = await Report.findById(disputeId)
      .populate("orderId")
      .populate("reporterId", "fullName walletBalance")
      .populate("reportedUserId", "fullName")
      .session(session);

    if (!dispute) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Không tìm thấy tranh chấp." });
    }

    if (dispute.status !== "Pending") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Tranh chấp đã được xử lý hoặc đóng." });
    }

    const order = dispute.orderId;
    if (refundAmount > order.totalAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Số tiền hoàn (${refundAmount}) không được lớn hơn tổng đơn (${order.totalAmount})`,
      });
    }

    //  CẬP NHẬT DISPUTE
    dispute.status = "Resolved";
    dispute.resolution = {
      decision,
      notes: notes?.trim() || "",
      refundAmount: Number(refundAmount),
    };
    dispute.handledBy = req.user._id;
    dispute.handledAt = new Date();


    let refundTransaction = null;
    if (refundAmount > 0) {
     
      await User.findByIdAndUpdate(
        dispute.reporterId._id,
        { $inc: { walletBalance: refundAmount } },
        { session }
      );

    
      refundTransaction = await Transaction.create(
        [{
          userId: dispute.reporterId._id,
          orderId: order._id,
          type: "refund",
          amount: refundAmount,
          description: `Hoàn tiền tranh chấp #${dispute._id} - ${decision}`,
          status: "completed",
        }],
        { session }
      );
    }

 
    const isFullRefund = refundAmount === order.totalAmount;
    const isPartialRefund = refundAmount > 0 && refundAmount < order.totalAmount;

    const orderUpdate = {
      disputeId: dispute._id,
      orderStatus: "completed", // luôn hoàn thành sau khi xử lý tranh chấp
      paymentStatus: isFullRefund
        ? "refunded"
        : isPartialRefund
        ? "partially_refunded"
        : "paid",
    };

    await Order.findByIdAndUpdate(order._id, orderUpdate, { session });


    await dispute.save({ session });
    await session.commitTransaction();

    const messages = {
      refund_full: `Tranh chấp đơn #${order.orderGuid} đã được giải quyết: Hoàn tiền toàn bộ ${refundAmount.toLocaleString()}₫`,
      refund_partial: `Hoàn tiền một phần ${refundAmount.toLocaleString()}₫ cho đơn #${order.orderGuid}`,
      reject: `Tranh chấp đơn #${order.orderGuid} đã bị từ chối.`,
      keep_for_seller: `Tranh chấp bị từ chối. Tiền sẽ được chuyển cho người bán.`,
    };

    // Gửi cho người tố cáo 
    await sendNotification(dispute.reporterId._id, {
      title: "Tranh chấp đã được xử lý",
      body: messages[decision],
      data: { type: "dispute_resolved", disputeId: dispute._id.toString() },
    });

    // Gửi cho người bị tố cáo 
    await sendNotification(dispute.reportedUserId, {
      title: "Tranh chấp đã được xử lý",
      body: messages[decision],
      data: { type: "dispute_resolved", disputeId: dispute._id.toString() },
    });


    await AdminLog.create({
      adminId: req.user._id,
      action: "resolve_dispute",
      targetId: dispute._id,
      details: { decision, refundAmount, notes },
    });

    res.status(200).json({
      message: "Xử lý tranh chấp thành công!",
      data: {
        dispute: {
          _id: dispute._id,
          status: dispute.status,
          resolution: dispute.resolution,
          handledBy: req.user.fullName,
          handledAt: dispute.handledAt,
        },
        refundAmount,
        orderStatus: orderUpdate.orderStatus,
        paymentStatus: orderUpdate.paymentStatus,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error resolving dispute:", error);
    res.status(500).json({
      message: "Lỗi server khi xử lý tranh chấp.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createDispute,
  getAllDisputes,
  getDisputeById,
  resolveDispute,
};
