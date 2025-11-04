import Report from "../../models/Order/Reports.model.js";
import Order from "../../models/Order/Order.model.js";

//Tạo tranh chấp mới
export const createDispute = async (req, res) => {
  try {
    const { orderId, reportedUserId, reason, description, evidenceUrls } =
      req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    if (
      order.renterId.toString() !== req.user._id.toString() &&
      order.ownerId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({
          message: "Bạn không có quyền tạo tranh chấp cho đơn hàng này.",
        });
    }


    const newReport = await Report.create({
      orderId,
      reporterId: req.user._id,
      reportedUserId,
      reason,
      description,
      evidenceUrls,
      type: "dispute",
      status: "Pending",
    });

    
    order.orderStatus = "disputed";
    await order.save();

    return res.status(201).json({
      message: "Tạo tranh chấp thành công.",
      data: newReport,
    });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res
      .status(500)
      .json({
        message: "Lỗi server khi tạo tranh chấp.",
        error: error.message,
      });
  }
};

//Lấy danh sách tất cả tranh chấp 
export const getAllDisputes = async (req, res) => {
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
    res
      .status(500)
      .json({
        message: "Lỗi server khi lấy danh sách tranh chấp.",
        error: error.message,
      });
  }
};

// Admin xử lý tranh chấp
export const getDisputeById = async (req, res) => {
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
      req.user.role !== "admin" &&
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
    res
      .status(500)
      .json({
        message: "Lỗi server khi lấy tranh chấp.",
        error: error.message,
      });
  }
};

export const resolveDispute = async (req, res) => {
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
    res
      .status(500)
      .json({
        message: "Lỗi server khi xử lý tranh chấp.",
        error: error.message,
      });
  }
};