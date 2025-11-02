const Tax = require("../../models/Tax.model");

/**
 * Tự động cập nhật trạng thái tax:
 * - Deactivate tax đã hết hạn (effectiveTo < now)
 * - Activate tax đến hạn (effectiveFrom <= now && chưa hết hạn && chưa active)
 */
const autoUpdateTaxStatus = async () => {
  try {
    const now = new Date();

    // 1. Deactivate các tax đã hết hạn
    const expiredTaxes = await Tax.updateMany(
      {
        isActive: true,
        effectiveTo: { $exists: true, $lt: now },
      },
      {
        $set: { isActive: false },
      }
    );

    // 2. KHÔNG tự động activate tax đến hạn - để admin tự chọn
    // Chỉ log thông tin về tax có thể activate
    const availableTaxes = await Tax.find({
      isActive: false,
      effectiveFrom: { $lte: now },
      $or: [
        { effectiveTo: { $exists: false } }, // Không có hạn
        { effectiveTo: { $gte: now } }, // Chưa hết hạn
      ],
    })
      .sort({ effectiveFrom: -1 })
      .limit(1)
      .exec();

    if (availableTaxes.length > 0) {
      const activeTax = await Tax.findOne({ isActive: true });
      
      if (!activeTax && expiredTaxes.modifiedCount > 0) {
        // Nếu tax vừa hết hạn và không có tax mới
        console.warn(
          `⚠️ Cảnh báo: Tax đã hết hạn nhưng không có tax active. Có ${availableTaxes.length} tax đang trong hiệu lực có thể được activate bởi admin. Hệ thống đang dùng tax mặc định 3%.`
        );
      }
    }

    if (expiredTaxes.modifiedCount > 0) {
      console.log(
        `Đã deactivate ${expiredTaxes.modifiedCount} tax hết hạn`
      );
    }

    return {
      expiredCount: expiredTaxes.modifiedCount,
      activatedId: null, // Không tự động activate tax
    };
  } catch (error) {
    console.error("Lỗi tự động cập nhật trạng thái tax:", error);
    throw error;
  }
};

module.exports = {
  autoUpdateTaxStatus,
};

