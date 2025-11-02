const Tax = require("../../models/Tax.model");
const AuditLog = require("../../models/AuditLog.model");

/**
 * Lấy cấu hình thuế hiện tại (public)
 * Tự động cập nhật trạng thái tax khi query
 */
const getCurrentTax = async (req, res) => {
  try {
    const now = new Date();

    // Tự động deactivate tax hết hạn
    await Tax.updateMany(
      {
        isActive: true,
        effectiveTo: { $exists: true, $lt: now },
      },
      {
        $set: { isActive: false },
      }
    );

    // KHÔNG tự động activate - để admin tự chọn tax để activate

    const tax = await Tax.getCurrentTax();
    
    if (!tax) {
      // Nếu không có tax active, trả về tax mặc định 3%
      // Lưu ý: Đây chỉ là giá trị mặc định trong code, không phải tax thật trong DB
      return res.status(200).json({
        success: true,
        message: "⚠️ Chưa có cấu hình thuế active, sử dụng thuế mặc định 3%. Vui lòng tạo cấu hình thuế mới.",
        data: {
          taxRate: 3,
          description: "Thuế mặc định (tạm thời - cần tạo cấu hình thuế mới)",
          isActive: false,
          effectiveFrom: now.toISOString(),
          effectiveTo: null,
          isDefault: true, // Flag để biết đây là tax mặc định, không phải từ DB
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy cấu hình thuế thành công",
      data: {
        taxRate: tax.taxRate,
        description: tax.description,
        isActive: tax.isActive,
        effectiveFrom: tax.effectiveFrom,
        effectiveTo: tax.effectiveTo,
        createdAt: tax.createdAt,
        updatedAt: tax.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting current tax:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy cấu hình thuế",
      error: error.message,
    });
  }
};

/**
 * Lấy tất cả cấu hình thuế (admin only)
 */
const getAllTaxSettings = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeInactive = false } = req.query;

    const filter = {};
    if (!includeInactive) {
      filter.isActive = true;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [taxes, total] = await Promise.all([
      Tax.find(filter)
        .populate("createdBy", "fullName email")
        .populate("updatedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Tax.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách cấu hình thuế thành công",
      data: taxes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting all tax settings:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách cấu hình thuế",
      error: error.message,
    });
  }
};

/**
 * Tạo cấu hình thuế mới (admin only)
 */
const createTaxSetting = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { taxRate, description, effectiveFrom, effectiveTo } = req.body;

    // Validation
    if (!taxRate || taxRate < 0 || taxRate > 100) {
      return res.status(400).json({
        success: false,
        message: "Thuế suất phải từ 0% đến 100%",
      });
    }

    const now = new Date();
    const effectiveFromDate = effectiveFrom ? new Date(effectiveFrom) : now;
    const effectiveToDate = effectiveTo ? new Date(effectiveTo) : null;

    // Validation dates
    if (effectiveToDate && effectiveToDate <= effectiveFromDate) {
      return res.status(400).json({
        success: false,
        message: "Ngày hiệu lực đến phải sau ngày hiệu lực từ",
      });
    }

    // KHÔNG tự động activate - để admin tự chọn khi nào activate
    // Tạo tax setting mới với isActive = false
    const newTax = await Tax.create({
      taxRate: Number(taxRate),
      description: description || `Thuế suất ${taxRate}%`,
      isActive: false, // Luôn tạo với isActive = false, admin sẽ activate sau
      effectiveFrom: effectiveFromDate,
      effectiveTo: effectiveToDate,
      createdBy: userId,
      updatedBy: userId,
    });

    // Ghi audit log
    try {
      await AuditLog.create({
        TableName: "Tax",
        PrimaryKeyValue: newTax._id.toString(),
        Operation: "INSERT",
        ChangedByUserId: userId,
        ChangedAt: new Date(),
        ChangeSummary: `Tạo cấu hình thuế mới: ${taxRate}% - ${description || `Thuế suất ${taxRate}%`}`,
      });
    } catch (logError) {
      console.error("Error creating audit log:", logError);
      // Không throw error để không ảnh hưởng đến operation chính
    }

    return res.status(201).json({
      success: true,
      message: "Tạo cấu hình thuế thành công",
      data: newTax,
    });
  } catch (error) {
    console.error("Error creating tax setting:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo cấu hình thuế",
      error: error.message,
    });
  }
};

/**
 * Cập nhật cấu hình thuế (admin only)
 */
const updateTaxSetting = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { taxRate, description, effectiveFrom, effectiveTo, isActive } =
      req.body;

    const tax = await Tax.findById(id);
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cấu hình thuế",
      });
    }

    // Lưu thông tin CŨ trước khi cập nhật để lưu vào history
    const oldTaxRate = tax.taxRate;
    const oldDescription = tax.description;
    const oldEffectiveFrom = tax.effectiveFrom;
    const oldEffectiveTo = tax.effectiveTo;
    const oldIsActive = tax.isActive;

    // Validation taxRate nếu có
    if (taxRate !== undefined) {
      if (taxRate < 0 || taxRate > 100) {
        return res.status(400).json({
          success: false,
          message: "Thuế suất phải từ 0% đến 100%",
        });
      }
    }

    // Kiểm tra xem có thay đổi gì không
    let hasChanges = false;
    if (taxRate !== undefined && Number(taxRate) !== oldTaxRate) hasChanges = true;
    if (description !== undefined && description !== oldDescription) hasChanges = true;
    if (effectiveFrom !== undefined && new Date(effectiveFrom).getTime() !== new Date(oldEffectiveFrom).getTime()) hasChanges = true;
    if (effectiveTo !== undefined) {
      const newEffectiveTo = effectiveTo ? new Date(effectiveTo) : null;
      const oldEffectiveToTime = oldEffectiveTo ? new Date(oldEffectiveTo).getTime() : null;
      if (newEffectiveTo?.getTime() !== oldEffectiveToTime) hasChanges = true;
    }
    if (isActive !== undefined && isActive !== oldIsActive) hasChanges = true;

    // Lưu lịch sử thay đổi NẾU có thay đổi
    if (hasChanges) {
      const historyEntry = {
        taxRate: oldTaxRate,
        description: oldDescription,
        effectiveFrom: oldEffectiveFrom,
        effectiveTo: oldEffectiveTo,
        changedAt: new Date(),
        changedBy: userId,
      };
      tax.history.push(historyEntry);
    }

    // Cập nhật thông tin
    if (taxRate !== undefined) tax.taxRate = Number(taxRate);
    if (description !== undefined) tax.description = description;
    if (effectiveFrom !== undefined)
      tax.effectiveFrom = new Date(effectiveFrom);
    if (effectiveTo !== undefined)
      tax.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
    if (isActive !== undefined) {
      tax.isActive = isActive;
      // Nếu kích hoạt tax này, tắt các tax khác
      if (isActive) {
        await Tax.updateMany(
          { _id: { $ne: id }, isActive: true },
          { isActive: false }
        );
      }
    }
    tax.updatedBy = userId;

    await tax.save();

    // Chuẩn bị mô tả thay đổi cho audit log
    const changes = [];
    if (taxRate !== undefined && Number(taxRate) !== oldTaxRate) {
      changes.push(`Thuế suất: ${oldTaxRate}% → ${taxRate}%`);
    }
    if (description !== undefined && description !== oldDescription) {
      changes.push(`Mô tả: "${oldDescription || 'N/A'}" → "${description}"`);
    }
    if (effectiveFrom !== undefined && new Date(effectiveFrom).getTime() !== new Date(oldEffectiveFrom).getTime()) {
      changes.push(`Hiệu lực từ: ${new Date(oldEffectiveFrom).toLocaleDateString('vi-VN')} → ${new Date(effectiveFrom).toLocaleDateString('vi-VN')}`);
    }
    if (effectiveTo !== undefined) {
      const newEffectiveTo = effectiveTo ? new Date(effectiveTo) : null;
      const oldEffectiveToTime = oldEffectiveTo ? new Date(oldEffectiveTo).getTime() : null;
      if (newEffectiveTo?.getTime() !== oldEffectiveToTime) {
        changes.push(`Hiệu lực đến: ${oldEffectiveTo ? new Date(oldEffectiveTo).toLocaleDateString('vi-VN') : 'Không giới hạn'} → ${newEffectiveTo ? newEffectiveTo.toLocaleDateString('vi-VN') : 'Không giới hạn'}`);
      }
    }
    if (isActive !== undefined && isActive !== oldIsActive) {
      changes.push(`Trạng thái: ${oldIsActive ? 'Active' : 'Inactive'} → ${isActive ? 'Active' : 'Inactive'}`);
    }

    // Ghi audit log
    try {
      await AuditLog.create({
        TableName: "Tax",
        PrimaryKeyValue: tax._id.toString(),
        Operation: "UPDATE",
        ChangedByUserId: userId,
        ChangedAt: new Date(),
        ChangeSummary: changes.length > 0 
          ? `Cập nhật cấu hình thuế: ${changes.join(', ')}`
          : "Cập nhật cấu hình thuế",
      });
    } catch (logError) {
      console.error("Error creating audit log:", logError);
      // Không throw error để không ảnh hưởng đến operation chính
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật cấu hình thuế thành công",
      data: tax,
    });
  } catch (error) {
    console.error("Error updating tax setting:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật cấu hình thuế",
      error: error.message,
    });
  }
};

/**
 * Xóa cấu hình thuế (admin only) - soft delete
 */
const deleteTaxSetting = async (req, res) => {
  try {
    const { id } = req.params;

    const tax = await Tax.findById(id);
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cấu hình thuế",
      });
    }

    // Chỉ xóa nếu không phải tax đang active
    if (tax.isActive) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa cấu hình thuế đang được sử dụng",
      });
    }

    // Lưu thông tin trước khi xóa để ghi log
    const taxInfo = {
      taxRate: tax.taxRate,
      description: tax.description,
      isActive: tax.isActive,
    };

    await Tax.findByIdAndDelete(id);

    // Ghi audit log
    try {
      await AuditLog.create({
        TableName: "Tax",
        PrimaryKeyValue: id,
        Operation: "DELETE",
        ChangedByUserId: req.user._id || req.user.id,
        ChangedAt: new Date(),
        ChangeSummary: `Xóa cấu hình thuế: ${taxInfo.taxRate}% - ${taxInfo.description || 'N/A'} (${taxInfo.isActive ? 'Active' : 'Inactive'})`,
      });
    } catch (logError) {
      console.error("Error creating audit log:", logError);
      // Không throw error để không ảnh hưởng đến operation chính
    }

    return res.status(200).json({
      success: true,
      message: "Xóa cấu hình thuế thành công",
    });
  } catch (error) {
    console.error("Error deleting tax setting:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa cấu hình thuế",
      error: error.message,
    });
  }
};

/**
 * Lấy lịch sử thay đổi thuế (admin only)
 */
const getTaxHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const tax = await Tax.findById(id).populate(
      "history.changedBy",
      "fullName email"
    );

    if (!tax) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cấu hình thuế",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy lịch sử thay đổi thuế thành công",
      data: {
        currentTax: {
          taxRate: tax.taxRate,
          description: tax.description,
          effectiveFrom: tax.effectiveFrom,
          effectiveTo: tax.effectiveTo,
        },
        history: tax.history,
      },
    });
  } catch (error) {
    console.error("Error getting tax history:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử thay đổi thuế",
      error: error.message,
    });
  }
};

/**
 * Lấy tất cả lịch sử tax (admin only) - tất cả các tax và history của chúng
 */
const getAllTaxHistory = async (req, res) => {
  try {
    // Lấy tất cả tax settings với history
    const taxes = await Tax.find({})
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .populate("history.changedBy", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    // Tạo timeline từ tất cả các event (tạo tax + history của mỗi tax)
    const timeline = [];

    taxes.forEach((tax) => {
      // Thêm event "Tạo tax"
      timeline.push({
        type: "create",
        taxId: tax._id,
        taxRate: tax.taxRate,
        description: tax.description,
        effectiveFrom: tax.effectiveFrom,
        effectiveTo: tax.effectiveTo,
        isActive: tax.isActive,
        createdAt: tax.createdAt,
        changedBy: tax.createdBy,
        taxInfo: {
          _id: tax._id,
          taxRate: tax.taxRate,
          description: tax.description,
        },
      });

      // Thêm tất cả history entries
      if (tax.history && tax.history.length > 0) {
        tax.history.forEach((historyEntry) => {
          timeline.push({
            type: "update",
            taxId: tax._id,
            taxRate: historyEntry.taxRate,
            description: historyEntry.description,
            effectiveFrom: historyEntry.effectiveFrom,
            effectiveTo: historyEntry.effectiveTo,
            changedAt: historyEntry.changedAt,
            changedBy: historyEntry.changedBy,
            taxInfo: {
              _id: tax._id,
              taxRate: tax.taxRate, // Current tax rate
              description: tax.description, // Current description
            },
          });
        });
      }
    });

    // Sắp xếp timeline theo thời gian (mới nhất trước)
    timeline.sort((a, b) => {
      const dateA = a.type === "create" ? new Date(a.createdAt) : new Date(a.changedAt);
      const dateB = b.type === "create" ? new Date(b.createdAt) : new Date(b.changedAt);
      return dateB.getTime() - dateA.getTime();
    });

    return res.status(200).json({
      success: true,
      message: "Lấy tất cả lịch sử thuế thành công",
      data: {
        timeline,
        totalEvents: timeline.length,
        totalTaxes: taxes.length,
      },
    });
  } catch (error) {
    console.error("Error getting all tax history:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy tất cả lịch sử thuế",
      error: error.message,
    });
  }
};

/**
 * Kích hoạt tax (admin only) - chỉ cho phép activate tax đang trong hiệu lực
 */
const activateTax = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const tax = await Tax.findById(id);
    if (!tax) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy cấu hình thuế",
      });
    }

    const now = new Date();

    // Kiểm tra tax có đang trong hiệu lực không
    const isInEffect = tax.effectiveFrom <= now && 
      (!tax.effectiveTo || tax.effectiveTo >= now);

    if (!isInEffect) {
      return res.status(400).json({
        success: false,
        message: "Không thể kích hoạt tax chưa đến hiệu lực hoặc đã hết hạn",
      });
    }

    // Nếu tax đã active rồi
    if (tax.isActive) {
      return res.status(200).json({
        success: true,
        message: "Tax này đã được kích hoạt",
        data: tax,
      });
    }

    // Lưu lịch sử thay đổi
    const historyEntry = {
      taxRate: tax.taxRate,
      description: tax.description,
      effectiveFrom: tax.effectiveFrom,
      effectiveTo: tax.effectiveTo,
      changedAt: new Date(),
      changedBy: userId,
    };
    tax.history.push(historyEntry);

    // Tắt tất cả tax active khác
    await Tax.updateMany(
      { _id: { $ne: id }, isActive: true },
      { isActive: false }
    );

    // Activate tax này
    tax.isActive = true;
    tax.updatedBy = userId;
    await tax.save();

    // Ghi audit log
    try {
      await AuditLog.create({
        TableName: "Tax",
        PrimaryKeyValue: tax._id.toString(),
        Operation: "UPDATE",
        ChangedByUserId: userId,
        ChangedAt: new Date(),
        ChangeSummary: `Kích hoạt cấu hình thuế: ${tax.taxRate}% - ${tax.description || 'N/A'}`,
      });
    } catch (logError) {
      console.error("Error creating audit log:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Kích hoạt cấu hình thuế thành công",
      data: tax,
    });
  } catch (error) {
    console.error("Error activating tax:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi kích hoạt cấu hình thuế",
      error: error.message,
    });
  }
};

module.exports = {
  getCurrentTax,
  getAllTaxSettings,
  createTaxSetting,
  updateTaxSetting,
  deleteTaxSetting,
  getTaxHistory,
  getAllTaxHistory,
  activateTax,
};

