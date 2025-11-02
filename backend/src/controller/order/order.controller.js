const mongoose = require("mongoose");
const { Types } = mongoose;
const Order = require("../../models/Order/Order.model"); 
const Item = require("../../models/Product/Item.model");
const User = require("../../models/User.model");
const ItemImages = require("../../models/Product/ItemImage.model");
const { calculateTotals } = require("./calculateRental");



function isTimeRangeOverlap(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

module.exports = {
  createOrder: async (req, res) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const renterId = req.user._id || req.user.id;
      const {
        itemId,
        quantity = 1,
        startAt,
        endAt,
        rentalStartDate,
        rentalEndDate,
        paymentMethod = "Wallet",
        shippingAddress,
        note = "",
      } = req.body;

      const finalStartAt = startAt || rentalStartDate;
      const finalEndAt = endAt || rentalEndDate;

      // === VALIDATE ===
      if (!itemId || !finalStartAt || !finalEndAt || !shippingAddress) {
        await session.abortTransaction();
        return res.status(400).json({
          message: "Missing required fields",
        });
      }

      const item = await Item.findById(itemId).session(session);
      if (!item || item.IsDeleted || item.StatusId !== 2) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Item unavailable" });
      }

      if (item.AvailableQuantity < quantity) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Not enough quantity" });
      }

      const images = await ItemImages.find({
        ItemId: item._id,
        IsPrimary: true,
        IsDeleted: false,
      })
        .sort({ Ordinal: 1 })
        .select("Url -_id")
        .lean()
        .session(session);

      // === TÍNH TOÁN ===
      const result = await calculateTotals(
        item,
        quantity,
        finalStartAt,
        finalEndAt
      );
      if (!result) {
        await session.abortTransaction();
        return res.status(400).json({
          message: "Không thể tính tiền thuê",
          debug: {
            itemId,
            PriceUnitId: item.PriceUnitId,
            BasePrice: item.BasePrice,
            DepositAmount: item.DepositAmount,
            quantity,
            startAt: finalStartAt,
            endAt: finalEndAt,
          },
        });
      }

      const { totalAmount, depositAmount, serviceFee, duration, unitName } =
        result;

      // === TẠO ORDER ===
      const orderDoc = await Order.create(
        [
          {
            renterId,
            ownerId: item.OwnerId,
            itemId: item._id,
            itemSnapshot: {
              title: item.Title,
              images: images.map((img) => img.Url),
              basePrice: item.BasePrice,
              priceUnit: String(item.PriceUnitId), // ← CHUYỂN SANG STRING
            },
            unitCount: quantity,
            startAt: new Date(finalStartAt),
            endAt: new Date(finalEndAt),
            totalAmount,
            depositAmount,
            serviceFee,
            currency: "VND",
            paymentMethod,
            orderStatus: "pending",
            paymentStatus: "not_paid",
            note,
            shippingAddress: { ...shippingAddress, snapshotAt: new Date() },
            rentalDuration: duration,
            rentalUnit: unitName,
            lifecycle: { createdAt: new Date() },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      const newOrder = orderDoc[0];

      return res.status(201).json({
        message: "Order created successfully",
        data: {
          orderId: newOrder._id,
          orderGuid: newOrder.orderGuid,
          totalAmount,
          depositAmount,
          serviceFee,
          rentalDuration: duration,
          rentalUnit: unitName,
        },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("createOrder ERROR:", err);
      return res.status(500).json({
        message: "Server error",
        error: err.message,
      });
    }
  },

  confirmOrder: async (req, res) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const ownerId = req.user._id;
      const orderId = req.params.id;
      if (!Types.ObjectId.isValid(orderId)) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Invalid order id" });
      }

      const order = await Order.findById(orderId).session(session);
      if (!order || order.isDeleted) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.ownerId.toString() !== ownerId.toString()) {
        await session.abortTransaction();
        return res.status(403).json({ message: "Forbidden: not owner" });
      }

      if (order.orderStatus !== "pending") {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "Only pending orders can be confirmed" });
      }

      const item = await Item.findOneAndUpdate(
        { _id: order.itemId, AvailableQuantity: { $gte: 1 }, IsDeleted: false },
        { $inc: { AvailableQuantity: -1 } },
        { new: true, session }
      );

      if (!item) {
        await session.abortTransaction();
        return res.status(409).json({ message: "Item is no longer available" });
      }

      order.orderStatus = "confirmed";
      order.lifecycle.confirmedAt = new Date();
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        message: "Order confirmed and inventory reserved",
        orderGuid: order.orderGuid,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("confirmOrder err:", err);
      return res
        .status(500)
        .json({ message: "Failed to confirm order", error: err.message });
    }
  },

  startOrder: async (req, res) => {
    try {
      const ownerId = req.user._id;
      const orderId = req.params.id;
      if (!Types.ObjectId.isValid(orderId))
        return res.status(400).json({ message: "Invalid order id" });

      const order = await Order.findById(orderId);
      if (!order || order.isDeleted)
        return res.status(404).json({ message: "Order not found" });

      if (order.ownerId.toString() !== ownerId.toString())
        return res.status(403).json({ message: "Forbidden: not owner" });

      if (order.orderStatus !== "confirmed")
        return res
          .status(400)
          .json({ message: "Only confirmed orders can be started" });

      if (order.startAt && new Date(order.startAt) > new Date()) {
        return res.status(400).json({
          message: "Cannot start rental before scheduled start date",
        });
      }

      order.orderStatus = "progress";
      order.lifecycle.startedAt = new Date();
      await order.save();

      return res.json({ message: "Order started", orderGuid: order.orderGuid });
    } catch (err) {
      console.error("startOrder err:", err);
      return res
        .status(500)
        .json({ message: "Failed to start order", error: err.message });
    }
  },

  renterReturn: async (req, res) => {
    try {
      const renterId = req.user._id;
      const orderId = req.params.id;
      const { notes } = req.body;

      if (!Types.ObjectId.isValid(orderId))
        return res.status(400).json({ message: "Invalid order id" });

      const order = await Order.findById(orderId);
      if (!order || order.isDeleted)
        return res.status(404).json({ message: "Order not found" });

      if (order.renterId.toString() !== renterId.toString())
        return res.status(403).json({ message: "Forbidden: not renter" });

      if (order.orderStatus !== "progress")
        return res.status(400).json({
          message: "Order must be in progress to mark as returned",
        });

      order.orderStatus = "returned";
      order.returnInfo.returnedAt = new Date();
      order.returnInfo.notes = notes || "";
      await order.save();

      return res.status(200).json({
        message: "Order marked as returned",
        orderGuid: order.orderGuid,
      });
    } catch (err) {
      console.error("renterReturn err:", err);
      return res
        .status(500)
        .json({ message: "Failed to mark as returned", error: err.message });
    }
  },

  ownerComplete: async (req, res) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const ownerId = req.user._id;
      const orderId = req.params.id;
      const {
        conditionStatus = "Good",
        damageFee = 0,
        ownerNotes = "",
      } = req.body;

      if (!Types.ObjectId.isValid(orderId)) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Invalid order id" });
      }

      const order = await Order.findById(orderId).session(session);
      if (!order || order.isDeleted) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.ownerId.toString() !== ownerId.toString()) {
        await session.abortTransaction();
        return res.status(403).json({ message: "Forbidden: not owner" });
      }

      if (!order.returnInfo || !order.returnInfo.returnedAt) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "Renter hasn't reported return yet" });
      }

      if (!["progress", "returned"].includes(order.orderStatus)) {
        await session.abortTransaction();
        return res.status(400).json({
          message: "Order must be in progress or returned to complete",
        });
      }

      const normalizeCondition = (status) => {
        const map = {
          good: "Good",
          slightlydamaged: "SlightlyDamaged",
          heavilydamaged: "HeavilyDamaged",
          lost: "Lost",
        };
        return map[status?.toLowerCase()] || "Good";
      };

      order.returnInfo.confirmedBy = ownerId;
      order.returnInfo.conditionStatus = normalizeCondition(conditionStatus);
      order.returnInfo.notes =
        (order.returnInfo.notes || "") + "\nOwnerNote: " + ownerNotes;
      order.returnInfo.damageFee = Math.max(0, Number(damageFee) || 0);

      order.paymentStatus = order.returnInfo.damageFee > 0 ? "partial" : "paid";

      order.orderStatus = "completed";
      order.lifecycle.completedAt = new Date();

      const item = await Item.findById(order.itemId).session(session);
      if (item) {
        if (order.returnInfo.conditionStatus === "Lost") {
          item.Quantity = Math.max(0, (item.Quantity || 0) - 1);

          if (item.AvailableQuantity > item.Quantity)
            item.AvailableQuantity = item.Quantity;
        } else {
          item.AvailableQuantity = (item.AvailableQuantity || 0) + 1;

          if (item.Quantity && item.AvailableQuantity > item.Quantity) {
            item.AvailableQuantity = item.Quantity;
          }
        }
        await item.save({ session });
      }

      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        message: "Order completed",
        orderGuid: order.orderGuid,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("ownerComplete err:", err);
      return res
        .status(500)
        .json({ message: "Failed to complete order", error: err.message });
    }
  },

  cancelOrder: async (req, res) => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const userId = req.user._id;
      const orderId = req.params.id;
      const { reason = "Cancelled by user" } = req.body;

      if (!Types.ObjectId.isValid(orderId)) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Invalid order id" });
      }

      const order = await Order.findById(orderId).session(session);
      if (!order || order.isDeleted) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Order not found" });
      }

      if (
        ![order.renterId.toString(), order.ownerId.toString()].includes(
          userId.toString()
        )
      ) {
        await session.abortTransaction();
        return res.status(403).json({ message: "Forbidden" });
      }

      if (order.orderStatus === "pending") {
        order.orderStatus = "cancelled";
        order.cancelReason = reason;
        order.lifecycle.canceledAt = new Date();
        await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        return res.json({
          message: "Order cancelled",
          orderGuid: order.orderGuid,
        });
      }

      if (order.orderStatus === "confirmed") {
        // only owner can cancel confirmed order and must restore inventory
        if (userId.toString() !== order.ownerId.toString()) {
          await session.abortTransaction();
          return res
            .status(403)
            .json({ message: "Only owner can cancel a confirmed order" });
        }

        // restore inventory (since confirm decremented)
        const item = await Item.findById(order.itemId).session(session);
        if (item) {
          item.AvailableQuantity = (item.AvailableQuantity || 0) + 1;
          if (item.Quantity && item.AvailableQuantity > item.Quantity)
            item.AvailableQuantity = item.Quantity;
          await item.save({ session });
        }

        order.orderStatus = "cancelled";
        order.cancelReason = reason;
        order.lifecycle.canceledAt = new Date();
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();
        return res.json({
          message: "Confirmed order cancelled and inventory restored",
          orderGuid: order.orderGuid,
        });
      }

      // cannot cancel in progress/completed/disputed via this endpoint
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message:
          "Cannot cancel order at this stage; open dispute or contact admin",
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("cancelOrder err:", err);
      return res
        .status(500)
        .json({ message: "Failed to cancel order", error: err.message });
    }
  },

  disputeOrder: async (req, res) => {
    try {
      const userId = req.user._id;
      const orderId = req.params.id;
      const { reason = "" } = req.body;

      if (!Types.ObjectId.isValid(orderId))
        return res.status(400).json({ message: "Invalid order id" });

      const order = await Order.findById(orderId);
      if (!order || order.isDeleted)
        return res.status(404).json({ message: "Order not found" });

      if (
        ![order.renterId.toString(), order.ownerId.toString()].includes(
          userId.toString()
        )
      )
        return res.status(403).json({ message: "Forbidden" });

      if (order.orderStatus === "completed")
        return res
          .status(400)
          .json({ message: "Order already completed - contact admin" });

      order.orderStatus = "disputed";
      order.disputeReason = reason;
      order.lifecycle.disputedAt = new Date();
      await order.save();

      return res.json({
        message: "Dispute opened",
        orderGuid: order.orderGuid,
      });
    } catch (err) {
      console.error("disputeOrder err:", err);
      return res
        .status(500)
        .json({ message: "Failed to open dispute", error: err.message });
    }
  },

  getOrder: async (req, res) => {
    try {
      const userId = req.user._id;
      const orderId = req.params.id;

      if (!Types.ObjectId.isValid(orderId))
        return res.status(400).json({ message: "Invalid order id" });

      const order = await Order.findById(orderId)
        .populate("renterId", "fullName email avatarUrl")
        .populate("ownerId", "fullName email avatarUrl")
        .lean();

      if (!order || order.isDeleted)
        return res.status(404).json({ message: "Order not found" });

      if (
        ![order.renterId._id.toString(), order.ownerId._id.toString()].includes(
          userId.toString()
        )
      )
        return res.status(403).json({ message: "Forbidden" });

      return res.json({ message: "OK", data: order });
    } catch (err) {
      console.error("getOrder err:", err);
      return res
        .status(500)
        .json({ message: "Failed to get order", error: err.message });
    }
  },

  listOrders: async (req, res) => {
    try {
      const userId = req.user._id;
      const role = req.user.role?.toLowerCase();
      const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;

      const filter = { isDeleted: false };

      if (role === "renter") {
        filter.renterId = userId;
      } else if (role === "owner") {
        filter.$or = [{ ownerId: userId }, { renterId: userId }];
      } else {
        return res.status(403).json({
          message: "You are not permitted to access orders",
        });
      }

      if (status) filter.orderStatus = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (search)
        filter["itemSnapshot.title"] = { $regex: search, $options: "i" };

      const skip = (Number(page) - 1) * Number(limit);

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate("renterId", "fullName email")
          .populate("ownerId", "fullName email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Order.countDocuments(filter),
      ]);

      return res.json({
        message: "OK",
        data: orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) {
      console.error("listOrders err:", err);
      return res.status(500).json({
        message: "Failed to list orders",
        error: err.message,
      });
    }
  },
  listOrdersByOnwer: async (req, res) => {
    try {
      const userId = req.user._id;
      const role = req.user.role?.toLowerCase();
      const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;

      // Bộ lọc mặc định
      const filter = { isDeleted: false };

      // Phân quyền lấy đơn
      if (role === "renter") {
     
        filter.renterId = userId;
      } else if (role === "owner") {

        filter.ownerId = userId;
      } else {
        return res.status(403).json({
          message: "You are not permitted to access orders",
        });
      }


      if (status) filter.orderStatus = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (search)
        filter["itemSnapshot.title"] = { $regex: search, $options: "i" };

      const skip = (Number(page) - 1) * Number(limit);


      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate("renterId", "fullName email")
          .populate("ownerId", "fullName email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Order.countDocuments(filter),
      ]);

      return res.json({
        message: "OK",
        data: orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) {
      console.error("listOrders err:", err);
      return res.status(500).json({
        message: "Failed to list orders",
        error: err.message,
      });
    }
  },
};


  


