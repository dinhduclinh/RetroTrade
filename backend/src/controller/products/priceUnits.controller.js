const PriceUnits = require("../../models/PriceUnits.model");

const getPriceUnits = async (req, res) => {
  try {
    const priceUnits = await PriceUnits.find({ IsDeleted: false }).sort({
      UnitId: 1,
    });
    res.status(200).json({
      success: true,
      message: "Price units fetched successfully",
      data: priceUnits,
    });
  } catch (error) {
    console.error("Error fetching price units:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching price units",
      error: error.message,
    });
  }
};

module.exports = { getPriceUnits };
