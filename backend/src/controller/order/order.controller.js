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
        discountCode,
        publicDiscountCode,
        privateDiscountCode,
      } = req.body;

      const finalStartAt = startAt || rentalStartDate;
      const finalEndAt = endAt || rentalEndDate;

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

      // === DISCOUNT ===
      // Tính baseAmount cho discount = totalAmount (tiền thuê) + depositAmount (tiền cọc)
      const baseAmountForDiscount = totalAmount + depositAmount;
      let discountInfo = null;
      let finalAmount = baseAmountForDiscount;
      let totalDiscountAmount = 0;
      const discountCodes = [];
      
      // Legacy support: if discountCode is provided, use it
      const publicCode = publicDiscountCode || (discountCode ? discountCode : null);
      const privateCode = privateDiscountCode;
      
      // Apply public discount first (if exists)
      if (publicCode) {
        try {
          const DiscountController = require("./discount.controller");
          const Discount = require("../../models/Discount.model");
          const DiscountAssignment = require("../../models/Discount/DiscountAssignment.model");
          const DiscountRedemption = require("../../models/Discount/DiscountRedemption.model");
          const validated = await DiscountController.validateAndCompute({
            code: publicCode,
            baseAmount: baseAmountForDiscount,
            ownerId: item.OwnerId,
            itemId: item._id,
            userId: renterId,
          });
          if (validated.valid && validated.discount.isPublic) {
            finalAmount = Math.max(0, baseAmountForDiscount - validated.amount);
            totalDiscountAmount += validated.amount;
            discountCodes.push(publicCode.toUpperCase());
            discountInfo = {
              code: publicCode.toUpperCase(),
              type: validated.discount.type,
              value: validated.discount.value,
              amountApplied: validated.amount,
            };
            // Store discount info for later use (after order is created)
            if (!discountInfo._publicDiscountData) {
              discountInfo._publicDiscountData = {
                discount: validated.discount,
                amount: validated.amount,
              };
            }
          }
        } catch (e) {
          // ignore discount errors to not block order creation
        }
      }
      
      // Apply private discount on remaining amount (if exists)
      if (privateCode && finalAmount > 0) {
        try {
          const DiscountController = require("./discount.controller");
          const Discount = require("../../models/Discount.model");
          const DiscountAssignment = require("../../models/Discount/DiscountAssignment.model");
          const DiscountRedemption = require("../../models/Discount/DiscountRedemption.model");
          const validated = await DiscountController.validateAndCompute({
            code: privateCode,
            baseAmount: finalAmount, // Use remaining amount after public discount
            ownerId: item.OwnerId,
            itemId: item._id,
            userId: renterId,
          });
          if (validated.valid && !validated.discount.isPublic) {
            finalAmount = Math.max(0, finalAmount - validated.amount);
            totalDiscountAmount += validated.amount;
            // Update discountInfo to include both codes
            if (discountInfo) {
              discountInfo.secondaryCode = privateCode.toUpperCase();
              discountInfo.secondaryType = validated.discount.type;
              discountInfo.secondaryValue = validated.discount.value;
              discountInfo.secondaryAmountApplied = validated.amount;
              discountInfo.totalAmountApplied = totalDiscountAmount;
            } else {
              discountInfo = {
                code: privateCode.toUpperCase(),
                type: validated.discount.type,
                value: validated.discount.value,
                amountApplied: validated.amount,
              };
            }
            // Store discount info for later use (after order is created)
            if (!discountInfo._privateDiscountData) {
              discountInfo._privateDiscountData = {
                discount: validated.discount,
                amount: validated.amount,
              };
            }
          }
        } catch (e) {
          // ignore discount errors to not block order creation
        }
      }

      // Tính lại finalAmount sau khi apply discount
      // finalAmount = totalAmount + serviceFee + depositAmount - totalDiscountAmount
      const finalOrderAmount = Math.max(0, totalAmount + serviceFee + depositAmount - totalDiscountAmount);

      // Clean up internal data before saving
      const cleanDiscountInfo = discountInfo ? {
        code: discountInfo.code,
        type: discountInfo.type,
        value: discountInfo.value,
        amountApplied: discountInfo.amountApplied || 0,
        secondaryCode: discountInfo.secondaryCode,
        secondaryType: discountInfo.secondaryType,
        secondaryValue: discountInfo.secondaryValue,
        secondaryAmountApplied: discountInfo.secondaryAmountApplied || 0,
        totalAmountApplied: discountInfo.totalAmountApplied || totalDiscountAmount,
      } : null;

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
              priceUnit: String(item.PriceUnitId),
            },
            unitCount: quantity,
            startAt: new Date(finalStartAt),
            endAt: new Date(finalEndAt),
            totalAmount,
            discount: cleanDiscountInfo || undefined,
            finalAmount: finalOrderAmount,
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

      const newOrder = orderDoc[0];

      // Cập nhật DiscountRedemption với orderId và increment usedCount trong transaction
      const publicDiscountData = discountInfo?._publicDiscountData;
      const privateDiscountData = discountInfo?._privateDiscountData;

      // Increment discount usedCount and create DiscountRedemption for public discount
      if (publicDiscountData) {
        try {
          const Discount = require("../../models/Discount.model");
          const DiscountAssignment = require("../../models/Discount/DiscountAssignment.model");
          const DiscountRedemption = require("../../models/Discount/DiscountRedemption.model");
          
          await Discount.updateOne(
            { _id: publicDiscountData.discount._id },
            { $inc: { usedCount: 1 } },
            { session }
          );
          
          try {
            await DiscountAssignment.updateOne(
              { discountId: publicDiscountData.discount._id, userId: renterId },
              { $inc: { usedCount: 1 } },
              { session }
            );
          } catch (assignErr) {
            // Ignore nếu không có assignment (đối với discount công khai không được claim)
          }
          
          try {
            await DiscountRedemption.create([{
              discountId: publicDiscountData.discount._id,
              userId: renterId,
              orderId: newOrder._id,
              amountApplied: publicDiscountData.amount,
              status: "applied",
            }], { session });
          } catch (redemptionErr) {
            console.error("Error creating public discount redemption:", redemptionErr);
          }
        } catch (incErr) {
          console.error("Error incrementing public discount:", incErr);
        }
      }

      // Increment discount usedCount and create DiscountRedemption for private discount
      if (privateDiscountData) {
        try {
          const Discount = require("../../models/Discount.model");
          const DiscountAssignment = require("../../models/Discount/DiscountAssignment.model");
          const DiscountRedemption = require("../../models/Discount/DiscountRedemption.model");
          
          await Discount.updateOne(
            { _id: privateDiscountData.discount._id },
            { $inc: { usedCount: 1 } },
            { session }
          );
          
          await DiscountAssignment.updateOne(
            { discountId: privateDiscountData.discount._id, userId: renterId },
            { $inc: { usedCount: 1 } },
            { session }
          );
          
          try {
            await DiscountRedemption.create([{
              discountId: privateDiscountData.discount._id,
              userId: renterId,
              orderId: newOrder._id,
              amountApplied: privateDiscountData.amount,
              status: "applied",
            }], { session });
          } catch (redemptionErr) {
            console.error("Error creating private discount redemption:", redemptionErr);
          }
        } catch (incErr) {
          console.error("Error incrementing private discount:", incErr);
        }
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message: "Tạo đơn hàng thành công",
        data: {
          orderId: newOrder._id,
          orderGuid: newOrder.orderGuid,
          totalAmount,
          finalAmount: finalOrderAmount,
          discount: cleanDiscountInfo,
          depositAmount,
          serviceFee,
          rentalDuration: duration,
          rentalUnit: unitName,
        },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Lỗi khi tạo đơn hàng :", err);
      return res.status(500).json({
        message: "Lỗi máy chủ",
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

      // Cộng RT Points cho renter khi order được xác nhận (không block nếu lỗi)
      try {
        const loyaltyController = require("../loyalty/loyalty.controller");
        const { createNotification } = require("../../middleware/createNotification");
        const result = await loyaltyController.addOrderPoints(
          order.renterId,
          order._id,
          order.finalAmount || order.totalAmount
        );
        if (result && result.success && result.transaction) {
          await createNotification(
            order.renterId,
            "Loyalty",
            "Cộng RT Points từ đơn hàng",
            `Bạn đã nhận ${result.transaction.points} RT Points từ đơn hàng ${order.orderGuid}.`,
            { points: result.transaction.points, orderId: String(order._id), orderGuid: order.orderGuid, reason: "order_completed" }
          );
        }
      } catch (loyaltyError) {
        console.error("Error adding order points:", loyaltyError);
        // Không block order confirmation nếu lỗi loyalty points
      }

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
        if (userId.toString() !== order.ownerId.toString()) {
          await session.abortTransaction();
          return res
            .status(403)
            .json({ message: "Only owner can cancel a confirmed order" });
        }

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
        .populate("renterId", "fullName email avatarUrl userGuid")
        .populate("ownerId", "fullName email avatarUrl userGuid")
        .lean();

      if (!order || order.isDeleted)
        return res.status(404).json({ message: "Order not found" });

      // Allow moderator and admin to view any order
      const isModeratorOrAdmin = req.user.role === "moderator" || req.user.role === "admin";
      if (
        !isModeratorOrAdmin &&
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
      const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;

      // Cho phép mọi role xem đơn hàng của mình (là renter hoặc owner)
      const filter = {
        isDeleted: false,
        $or: [{ renterId: userId }, { ownerId: userId }],
      };

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
      const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;

      const filter = {
        isDeleted: false,
        ownerId: userId,
      };

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
      console.error("listOrdersByOnwer err:", err);
      return res.status(500).json({
        message: "Failed to list orders",
        error: err.message,
      });
    }
  },
};
