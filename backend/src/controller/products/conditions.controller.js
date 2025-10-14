const ItemConditions = require("../../models/ItemConditions.model");

const getConditions = async (req, res) => {
  try {
    const conditions = await ItemConditions.find({ IsDeleted: false }).sort({
      ConditionId: 1,
    });
    res.status(200).json({
      success: true,
      message: "Conditions fetched successfully",
      data: conditions,
    });
  } catch (error) {
    console.error("Error fetching conditions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching conditions",
      error: error.message,
    });
  }
};

module.exports = { getConditions };
