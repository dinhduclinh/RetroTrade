const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

const Item = require("../../models/Product/Item.model");
const ItemImages = require("../../models/Product/ItemImage.model");
const ItemTag = require("../../models/Product/ItemTag.model");
const AuditLog = require("../../models/AuditLog.model");
const Categories = require("../../models/Product/Categories.model");
const ItemConditions = require("../../models/Product/ItemConditions.model");
const PriceUnits = require("../../models/Product/PriceUnits.model");
const User = require("../../models/User.model");
const Tags = require("../../models/Tag.model");

//list all product
const listAllItems = async (req, res) => {
  try {
    const items = await Item.find({
      StatusId: 2,
      IsDeleted: false
    })
    .populate('CategoryId', 'Name') 
    .populate('OwnerId', 'Username Email') 
    .sort({ CreatedAt: -1 }) 
    .lean();

    res.status(200).json({
      success: true,
      message: 'Danh sách sản phẩm công khai đã được duyệt',
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('Error in listAllItems:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm',
      error: error.message
    });
  }
};

module.exports = { listAllItems };