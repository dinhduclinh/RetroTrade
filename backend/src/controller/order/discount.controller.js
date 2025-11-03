const mongoose = require("mongoose");
const Discount = require("../../models/Discount/Discount.model");
const { generateString } = require("../../utils/generateString");

function clampDiscountAmount(type, value, baseAmount, maxDiscountAmount) {
    let amount = type === "percent" ? (baseAmount * value) / 100 : value;
    if (maxDiscountAmount && maxDiscountAmount > 0) {
        amount = Math.min(amount, maxDiscountAmount);
    }
    amount = Math.max(0, Math.min(baseAmount, Math.floor(amount)));
    return amount;
}

module.exports = {
    create: async (req, res) => {
        try {
            const {
                type,
                value,
                maxDiscountAmount = 0,
                minOrderAmount = 0,
                startAt,
                endAt,
                usageLimit = 0,
                ownerId,
                itemId,
                notes,
                codeLength = 10,
                codePrefix,
                isPublic = true,
                allowedUsers = [],
            } = req.body;

            if (!type || value == null || !startAt || !endAt) {
                return res.status(400).json({ status: "error", message: "Thiếu dữ liệu bắt buộc" });
            }
            if (!["percent", "fixed"].includes(type)) {
                return res.status(400).json({ status: "error", message: "Loại giảm giá không hợp lệ" });
            }
            if (new Date(endAt) <= new Date(startAt)) {
                return res.status(400).json({ status: "error", message: "Thời gian kết thúc phải sau thời gian bắt đầu" });
            }

            // Chuẩn hóa và validate theo loại giảm giá
            let normalizedValue = Number(value);
            let normalizedMax = Number(maxDiscountAmount) || 0;
            let normalizedMinOrder = Number(minOrderAmount) || 0;
            if (type === "percent") {
                if (!(normalizedValue >= 0 && normalizedValue <= 100)) {
                    return res.status(400).json({ status: "error", message: "Giá trị phần trăm phải từ 0 đến 100" });
                }
                // phần trăm cho phép số lẻ, giới hạn 1 chữ số thập phân
                normalizedValue = Math.max(0, Math.min(100, Number.isFinite(normalizedValue) ? normalizedValue : 0));
            } else if (type === "fixed") {
                // Cố định: tiền tệ VNĐ, làm tròn xuống đơn vị đồng
                normalizedValue = Math.max(0, Math.floor(Number.isFinite(normalizedValue) ? normalizedValue : 0));
                normalizedMax = Math.max(0, Math.floor(normalizedMax));
                normalizedMinOrder = Math.max(0, Math.floor(normalizedMinOrder));
                if (normalizedValue <= 0) {
                    return res.status(400).json({ status: "error", message: "Giá trị giảm cố định (VNĐ) phải lớn hơn 0" });
                }
            }

            let code;
            const rawPrefix = (codePrefix || "").toString().toUpperCase();
            const sanitizedPrefix = rawPrefix.replace(/[^A-Z0-9]/g, "");
            const targetTotalLen = Math.max(1, Math.min(32, Number(codeLength) || 10));
            const prefixLen = Math.min(sanitizedPrefix.length, targetTotalLen);
            const randomLen = Math.max(0, targetTotalLen - prefixLen);
            for (let i = 0; i < 5; i++) {
                const suffix = randomLen > 0 ? generateString(randomLen).toUpperCase() : "";
                const candidate = (sanitizedPrefix.slice(0, prefixLen) + suffix).toUpperCase();
                // eslint-disable-next-line no-await-in-loop
                const exists = await Discount.exists({ code: candidate });
                if (!exists) {
                    code = candidate;
                    break;
                }
            }
            if (!code) {
                return res.status(500).json({ status: "error", message: "Tạo mã giảm giá thất bại, vui lòng thử lại" });
            }

            const doc = await Discount.create({
                code,
                type,
                value: normalizedValue,
                maxDiscountAmount: normalizedMax,
                minOrderAmount: normalizedMinOrder,
                startAt,
                endAt,
                usageLimit,
                ownerId,
                itemId,
                notes,
                isPublic: Boolean(isPublic),
                allowedUsers: Array.isArray(allowedUsers) ? allowedUsers : [],
                createdBy: req.user?._id,
            });

            return res.status(201).json({ status: "success", message: type === "fixed" ? "Tạo mã giảm giá thành công (đơn vị VNĐ)" : "Tạo mã giảm giá thành công", data: doc });
        } catch (err) {
            return res.status(500).json({ status: "error", message: "Lỗi máy chủ", error: err.message });
        }
    },

    list: async (req, res) => {
        try {
            const { active, ownerId, itemId, page = 1, limit = 20 } = req.query;
            const filter = {};
            if (active != null) filter.active = String(active) === "true";
            if (ownerId) filter.ownerId = ownerId;
            if (itemId) filter.itemId = itemId;
            const skip = (Number(page) - 1) * Number(limit);
            const [rows, total] = await Promise.all([
                Discount.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
                Discount.countDocuments(filter),
            ]);
            return res.json({ status: "success", message: "Thành công", data: rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
        } catch (err) {
            return res.status(500).json({ status: "error", message: "Không thể tải danh sách", error: err.message });
        }
    },

    getByCode: async (req, res) => {
        try {
            const { code } = req.params;
            const doc = await Discount.findOne({ code: code?.toUpperCase() }).lean();
            if (!doc) return res.status(404).json({ status: "error", message: "Không tìm thấy mã giảm giá" });
            return res.json({ status: "success", message: "Thành công", data: doc });
        } catch (err) {
            return res.status(500).json({ status: "error", message: "Lỗi khi lấy thông tin mã giảm giá", error: err.message });
        }
    },

    deactivate: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await Discount.findByIdAndUpdate(id, { active: false }, { new: true });
            if (!updated) return res.status(404).json({ status: "error", message: "Không tìm thấy mã giảm giá" });
            return res.json({ status: "success", message: "Đã vô hiệu hóa mã giảm giá", data: updated });
        } catch (err) {
            return res.status(500).json({ status: "error", message: "Vô hiệu hóa thất bại", error: err.message });
        }
    },

  activate: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await Discount.findByIdAndUpdate(id, { active: true }, { new: true });
      if (!updated) return res.status(404).json({ status: "error", message: "Không tìm thấy mã giảm giá" });
      return res.json({ status: "success", message: "Đã kích hoạt mã giảm giá", data: updated });
    } catch (err) {
      return res.status(500).json({ status: "error", message: "Kích hoạt thất bại", error: err.message });
    }
  },

  assignUsers: async (req, res) => {
    try {
      const { id } = req.params;
      const { userIds = [], perUserLimit = 1, effectiveFrom, effectiveTo } = req.body;
      if (!Array.isArray(userIds)) {
        return res.status(400).json({ status: "error", message: "Danh sách người dùng không hợp lệ" });
      }
      const DiscountAssignment = require("../../models/Discount/DiscountAssignment.model");
      const DiscountModel = require("../../models/Discount/Discount.model");
      const updated = await DiscountModel.findByIdAndUpdate(id, { isPublic: false }, { new: true });
      if (!updated) return res.status(404).json({ status: "error", message: "Không tìm thấy mã giảm giá" });

      const ops = userIds.map((uid) => ({
        updateOne: {
          filter: { discountId: id, userId: uid },
          update: {
            $setOnInsert: { usedCount: 0 },
            $set: {
              perUserLimit: Math.max(0, Number(perUserLimit) || 1),
              effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
              effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
              active: true,
            },
          },
          upsert: true,
        },
      }));

      if (ops.length > 0) {
        await DiscountAssignment.bulkWrite(ops);
      }
      return res.json({ status: "success", message: "Đã gán người dùng cho mã", data: updated });
    } catch (err) {
      return res.status(500).json({ status: "error", message: "Gán người dùng thất bại", error: err.message });
    }
  },

  setPublic: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await Discount.findByIdAndUpdate(
        id,
        { isPublic: true },
        { new: true }
      );
      if (!updated) return res.status(404).json({ status: "error", message: "Không tìm thấy mã giảm giá" });
      return res.json({ status: "success", message: "Đã đặt mã ở chế độ công khai", data: updated });
    } catch (err) {
      return res.status(500).json({ status: "error", message: "Cập nhật thất bại", error: err.message });
    }
  },

  // === USER-FACING ===
  listAvailable: async (req, res) => {
    try {
      const { ownerId, itemId, page = 1, limit = 20 } = req.query;
      const now = new Date();
      const filter = {
        active: true,
        startAt: { $lte: now },
        endAt: { $gte: now },
        // public or assigned to current user via assignments
        isPublic: true,
      };
      if (ownerId) filter.ownerId = ownerId;
      if (itemId) filter.itemId = itemId;
      const skip = (Number(page) - 1) * Number(limit);
      const DiscountAssignment = require("../../models/Discount/DiscountAssignment.model");
      const [publicRows, publicTotal, privateAssignments] = await Promise.all([
        Discount.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        Discount.countDocuments(filter),
        DiscountAssignment.find({ userId: req.user?._id, active: true }).select("discountId").lean(),
      ]);
      const assignedIds = privateAssignments.map(a => a.discountId);
      const privateRows = assignedIds.length
        ? await Discount.find({
            _id: { $in: assignedIds },
            active: true,
            startAt: { $lte: now },
            endAt: { $gte: now },
            isPublic: false,
            ...(ownerId ? { ownerId } : {}),
            ...(itemId ? { itemId } : {}),
          })
            .sort({ createdAt: -1 })
            .lean()
        : [];
      const rows = [...publicRows, ...privateRows];
      const total = publicTotal + privateRows.length; // approximate
      return res.json({ status: "success", message: "Thành công", data: rows, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } });
    } catch (err) {
      return res.status(500).json({ status: "error", message: "Không thể tải danh sách mã", error: err.message });
    }
  },

  getPublicByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const now = new Date();
      const doc = await Discount.findOne({ code: code?.toUpperCase(), active: true, startAt: { $lte: now }, endAt: { $gte: now } }).lean();
      if (!doc) return res.status(404).json({ status: "error", message: "Mã không khả dụng" });
      if (!doc.isPublic) {
        const DiscountAssignment = require("../../models/Discount/DiscountAssignment.model");
        const assign = await DiscountAssignment.findOne({ discountId: doc._id, userId: req.user?._id, active: true }).lean();
        if (!assign) return res.status(403).json({ status: "error", message: "Bạn không được phép sử dụng mã này" });
        if (assign.effectiveFrom && now < new Date(assign.effectiveFrom)) return res.status(403).json({ status: "error", message: "Mã chưa đến thời gian sử dụng" });
        if (assign.effectiveTo && now > new Date(assign.effectiveTo)) return res.status(403).json({ status: "error", message: "Mã đã hết thời gian sử dụng" });
        if (assign.perUserLimit > 0 && (assign.usedCount || 0) >= assign.perUserLimit) return res.status(403).json({ status: "error", message: "Bạn đã dùng hết số lần cho phép" });
      }
      return res.json({ status: "success", message: "Thành công", data: doc });
    } catch (err) {
      return res.status(500).json({ status: "error", message: "Lỗi khi lấy thông tin mã", error: err.message });
    }
  },

  publicValidate: async (req, res) => {
    try {
      const { code, baseAmount, ownerId, itemId } = req.body;
      if (!code || baseAmount == null) {
        return res.status(400).json({ status: "error", message: "Thiếu mã hoặc tổng tiền" });
      }
      const result = await module.exports.validateAndCompute({ code, baseAmount: Number(baseAmount), ownerId, itemId, userId: req.user?._id });
      if (!result.valid) {
        return res.status(400).json({ status: "error", message: "Mã không hợp lệ hoặc không áp dụng", reason: result.reason });
      }
      return res.json({ status: "success", message: "Áp dụng mã thành công", data: { amount: result.amount, discount: result.discount } });
    } catch (err) {
      return res.status(500).json({ status: "error", message: "Lỗi xác thực mã", error: err.message });
    }
  },

    // Internal helper used by order create
  validateAndCompute: async ({ code, baseAmount, ownerId, itemId, userId }) => {
        const now = new Date();
    const DiscountAssignment = require("../../models/Discount/DiscountAssignment.model");
    const discount = await Discount.findOne({ code: code?.toUpperCase(), active: true }).lean();
        if (!discount) return { valid: false, reason: "INVALID_CODE" };
        if (discount.startAt && now < new Date(discount.startAt)) return { valid: false, reason: "NOT_STARTED" };
        if (discount.endAt && now > new Date(discount.endAt)) return { valid: false, reason: "EXPIRED" };
        if (discount.usageLimit > 0 && (discount.usedCount || 0) >= discount.usageLimit) return { valid: false, reason: "USAGE_LIMIT" };
        if (discount.minOrderAmount && baseAmount < discount.minOrderAmount) return { valid: false, reason: "BELOW_MIN_ORDER" };
        if (discount.ownerId && ownerId && String(discount.ownerId) !== String(ownerId)) return { valid: false, reason: "OWNER_NOT_MATCH" };
        if (discount.itemId && itemId && String(discount.itemId) !== String(itemId)) return { valid: false, reason: "ITEM_NOT_MATCH" };
    if (!discount.isPublic) {
      if (!userId) return { valid: false, reason: "NOT_ALLOWED_USER" };
      const assignment = await DiscountAssignment.findOne({ discountId: discount._id, userId, active: true }).lean();
      if (!assignment) return { valid: false, reason: "NOT_ALLOWED_USER" };
      if (assignment.effectiveFrom && now < new Date(assignment.effectiveFrom)) return { valid: false, reason: "ASSIGN_NOT_STARTED" };
      if (assignment.effectiveTo && now > new Date(assignment.effectiveTo)) return { valid: false, reason: "ASSIGN_EXPIRED" };
      if (assignment.perUserLimit > 0 && (assignment.usedCount || 0) >= assignment.perUserLimit) return { valid: false, reason: "PER_USER_LIMIT" };
    }

        const amount = clampDiscountAmount(discount.type, discount.value, baseAmount, discount.maxDiscountAmount || 0);
        return { valid: true, discount, amount };
    },
};


