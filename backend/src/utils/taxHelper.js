const Tax = require("../models/Tax.model");

/**
 * Lấy thuế suất hiện tại (active)
 * @returns {Promise<number>} Tax rate (0-100)
 */
const getCurrentTaxRate = async () => {
  try {
    const taxRate = await Tax.getCurrentTaxRate();
    return taxRate;
  } catch (error) {
    console.error("Error getting current tax rate:", error);
    // Trả về mặc định 3% nếu có lỗi
    return 3;
  }
};

/**
 * Tính số tiền thuế dựa trên amount và tax rate
 * @param {number} amount - Số tiền cần tính thuế
 * @param {number|null} taxRate - Thuế suất (nếu null sẽ lấy từ DB)
 * @returns {Promise<number>} Số tiền thuế
 */
const calculateTaxAmount = async (amount, taxRate = null) => {
  try {
    const rate = taxRate !== null ? taxRate : await getCurrentTaxRate();
    const taxAmount = (amount * rate) / 100;
    return Math.round(taxAmount);
  } catch (error) {
    console.error("Error calculating tax amount:", error);
    // Trả về 0 nếu có lỗi
    return 0;
  }
};

/**
 * Tính tổng tiền bao gồm thuế
 * @param {number} amount - Số tiền gốc
 * @param {number|null} taxRate - Thuế suất (nếu null sẽ lấy từ DB)
 * @returns {Promise<object>} { baseAmount, taxAmount, totalAmount }
 */
const calculateWithTax = async (amount, taxRate = null) => {
  try {
    const rate = taxRate !== null ? taxRate : await getCurrentTaxRate();
    const taxAmount = (amount * rate) / 100;
    const totalAmount = amount + taxAmount;

    return {
      baseAmount: Math.round(amount),
      taxRate: rate,
      taxAmount: Math.round(taxAmount),
      totalAmount: Math.round(totalAmount),
    };
  } catch (error) {
    console.error("Error calculating with tax:", error);
    // Trả về giá trị mặc định nếu có lỗi
    return {
      baseAmount: Math.round(amount),
      taxRate: 3,
      taxAmount: Math.round((amount * 3) / 100),
      totalAmount: Math.round(amount + (amount * 3) / 100),
    };
  }
};

/**
 * Lấy thông tin thuế đầy đủ (để log hoặc hiển thị)
 * @returns {Promise<object>} Tax information
 */
const getTaxInfo = async () => {
  try {
    const tax = await Tax.getCurrentTax();
    return {
      taxRate: tax ? tax.taxRate : 3,
      description: tax ? tax.description : "Thuế mặc định",
      isActive: tax ? tax.isActive : false,
      effectiveFrom: tax ? tax.effectiveFrom : null,
    };
  } catch (error) {
    console.error("Error getting tax info:", error);
    return {
      taxRate: 3,
      description: "Thuế mặc định",
      isActive: false,
      effectiveFrom: null,
    };
  }
};

module.exports = {
  getCurrentTaxRate,
  calculateTaxAmount,
  calculateWithTax,
  getTaxInfo,
};

