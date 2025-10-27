const mongoose = require("mongoose");
const { Types } = mongoose;
const Order = require("../../models/Order/Order.model"); 
const Item = require("../../models/Product/Item.model");
const User = require("../../models/User.model");


function daysBetween(startAt, endAt) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.ceil((new Date(endAt) - new Date(startAt)) / msPerDay);
  return Math.max(1, diff);
}


function calculateTotals(item, unitCount = 1, startAt, endAt) {
  const days = daysBetween(startAt, endAt);
  const pricePerDay = item.BasePrice || 0;
  const depositAmount = (item.DepositAmount || 0) * unitCount;
  const totalAmount = (pricePerDay * unitCount * days) + depositAmount;
  const serviceFee = Math.round(totalAmount * 0.05); 
  return { totalAmount, depositAmount, serviceFee, days };
}


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
        unitCount = 1,
        startAt,
        endAt,
        paymentMethod = "Wallet",
        note = "",
      } = req.body;

      if (!itemId || !startAt || !endAt) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!Types.ObjectId.isValid(itemId)) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Invalid itemId" });
      }
      if (Number(unitCount) !== 1) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "unitCount must be 1 for this flow" });
      }
      if (new Date(startAt) >= new Date(endAt)) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Invalid rental period" });
      }

      const item = await Item.findById(itemId).session(session);
      if (!item || item.IsDeleted) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Item not found" });
      }

      if (String(item.OwnerId) === String(renterId)) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Cannot rent your own item" });
      }
      if (item.StatusId !== 2) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "Item is not active/approved for rent" });
      }
      if ((item.AvailableQuantity || 0) < 1) {
        await session.abortTransaction();
        return res.status(409).json({ message: "Item is out of stock" });
      }

      const snapshot = {
        title: item.Title,
        images: item.Images || [],
        basePrice: item.BasePrice,
        priceUnit: item.PriceUnitId,
      };

      const { totalAmount, depositAmount, serviceFee, days } = calculateTotals(
        item,
        unitCount,
        startAt,
        endAt
      );

      const newOrder = await Order.create(
        [
          {
            renterId,
            ownerId: item.OwnerId,
            itemId,
            unitCount,
            startAt,
            endAt,
            totalAmount,
            depositAmount,
            serviceFee,
            currency: item.Currency || "VND",
            paymentMethod,
            orderStatus: "pending",
            paymentStatus: "not_paid",
            itemSnapshot: snapshot,
            note,
            lifecycle: { createdAt: new Date() },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message:
          "Order created (pending). Owner must confirm to reserve stock.",
        data: { orderGuid: newOrder[0].orderGuid, orderId: newOrder[0]._id },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("createOrder err:", err);
      return res
        .status(500)
        .json({ message: "Failed to create order", error: err.message });
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
      const { notes = "" } = req.body;

      if (!Types.ObjectId.isValid(orderId))
        return res.status(400).json({ message: "Invalid order id" });

      const order = await Order.findById(orderId);
      if (!order || order.isDeleted)
        return res.status(404).json({ message: "Order not found" });

      if (order.renterId.toString() !== renterId.toString())
        return res.status(403).json({ message: "Forbidden: not renter" });

      if (order.orderStatus !== "progress")
        return res
          .status(400)
          .json({ message: "Only in-progress orders can be returned" });

      order.returnInfo = order.returnInfo || {};
      order.returnInfo.returnedAt = new Date();
      order.returnInfo.notes = notes;

      await order.save();

      return res.json({
        message: "Return reported - awaiting owner confirmation",
        orderGuid: order.orderGuid,
      });
    } catch (err) {
      console.error("renterReturn err:", err);
      return res
        .status(500)
        .json({ message: "Failed to report return", error: err.message });
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

      if (order.orderStatus !== "progress") {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "Order cannot be completed in current status" });
      }

      order.returnInfo.confirmedBy = ownerId;
      order.returnInfo.conditionStatus = conditionStatus;
      order.returnInfo.notes =
        (order.returnInfo.notes || "") + "\nOwnerNote: " + ownerNotes;
      order.returnInfo.damageFee = Math.max(0, Number(damageFee) || 0);

      order.paymentStatus = order.returnInfo.damageFee > 0 ? "partial" : "paid";

      order.orderStatus = "completed";
      order.lifecycle.completedAt = new Date();
      const item = await Item.findById(order.itemId).session(session);
      if (item) {
        if (order.returnInfo.conditionStatus === "Lost") {
          // lost: decrease Quantity (total) by 1; AvailableQuantity already decremented at confirm,
          // so do not increment AvailableQuantity here.
          item.Quantity = Math.max(0, (item.Quantity || 0) - 1);
          // Ensure AvailableQuantity is not greater than Quantity
          if (item.AvailableQuantity > item.Quantity)
            item.AvailableQuantity = item.Quantity;
        } else {
          // Good / SlightlyDamaged / HeavilyDamaged -> restore available
          item.AvailableQuantity = (item.AvailableQuantity || 0) + 1;
          // cap to Quantity
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

  // -----------------------
  // Cancel order
  // - pending: renter or owner can cancel
  // - confirmed: only owner can cancel and inventory is restored
  // - other statuses: deny (need dispute/admin)
  // -----------------------
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
      return res
        .status(400)
        .json({
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
        .populate("renterId", "FullName Email")
        .populate("ownerId", "FullName Email")
        .populate("itemId", "Title Images");

      if (!order || order.isDeleted)
        return res.status(404).json({ message: "Order not found" });

      if (
        ![order.renterId._id.toString(), order.ownerId._id.toString()].includes(
          userId.toString()
        )
      )
        return res.status(403).json({ message: "Forbidden" });

      return res.json(order);
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
      const role = req.user.role;
      let filter = {};

      if (role === "renter") {
        filter.renterId = userId;
      } else if (role === "owner") {
        filter.ownerId = userId;
      } else {
        return res
          .status(403)
          .json({ message: "Invalid role for listing orders" });
      }

      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(req.query.limit) || 20);

      return res.json(orders);
    } catch (err) {
      console.error("listOrders err:", err);
      return res
        .status(500)
        .json({ message: "Failed to list orders", error: err.message });
    }
  },
};


  


