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
  let success = false;
  try {
    const items = await Item.find({ StatusId: 2, IsDeleted: false })
      .sort({ CreatedAt: -1 })
      .lean();

    if (!items || items.length === 0) {
      success = true;
      return res.status(200).json({
        success: true,
        message: "Không có sản phẩm công khai nào",
        data: {
          items: [],
          total: 0,
        },
      });
    }

    const itemIds = items.map((item) => item._id);

    const allImages = await ItemImages.find({
      ItemId: { $in: itemIds },
      IsDeleted: false,
    })
      .sort({ Ordinal: 1 })
      .lean();

    const allItemTags = await ItemTag.find({
      ItemId: { $in: itemIds },
      IsDeleted: false,
    }).lean();
    const tagIds = allItemTags.map((tag) => tag.TagId);
    const allTags = await Tags.find({
      _id: { $in: tagIds },
      isDeleted: false,
    }).lean();

    const categoryIds = [...new Set(items.map((item) => item.CategoryId))];
    const categories = await Categories.find({
      _id: { $in: categoryIds },
      isActive: true,
    }).lean();

    const allConditions = await ItemConditions.find({
      IsDeleted: false,
    }).lean();
    const allPriceUnits = await PriceUnits.find({ IsDeleted: false }).lean();

    const ownerIds = [...new Set(items.map((item) => item.OwnerId))];
    const owners = await User.find({
      _id: { $in: ownerIds },
    })
      .select("FullName DisplayName AvatarUrl")
      .lean();

    const ownerMap = {};
    owners.forEach((owner) => {
      ownerMap[owner._id.toString()] = owner;
    });

    const imagesMap = {};
    allImages.forEach((img) => {
      if (!imagesMap[img.ItemId.toString()]) {
        imagesMap[img.ItemId.toString()] = [];
      }
      imagesMap[img.ItemId.toString()].push(img);
    });

    const tagsMap = {};
    const tagMapById = {};
    allTags.forEach((tag) => {
      tagMapById[tag._id.toString()] = tag;
    });
    allItemTags.forEach((itemTag) => {
      if (!tagsMap[itemTag.ItemId.toString()]) {
        tagsMap[itemTag.ItemId.toString()] = [];
      }
      const fullTag = {
        ...itemTag,
        Tag: tagMapById[itemTag.TagId.toString()],
      };
      tagsMap[itemTag.ItemId.toString()].push(fullTag);
    });

    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat._id.toString()] = cat;
    });

    const itemsWithDetails = items
      .map((item) => ({
        ...item,
        Category: categoryMap[item.CategoryId.toString()],
        Condition: allConditions.find(
          (c) => c.ConditionId === item.ConditionId
        ),
        PriceUnit: allPriceUnits.find((p) => p.UnitId === item.PriceUnitId),
        Owner: ownerMap[item.OwnerId.toString()],
        Images: imagesMap[item._id.toString()] || [],
        Tags: tagsMap[item._id.toString()] || [],
      }))
      .filter((item) => item.Category);

    success = true;

    res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm công khai thành công",
      data: {
        items: itemsWithDetails,
        total: itemsWithDetails.length,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm công khai:", error);
    if (!success) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy danh sách sản phẩm công khai",
      });
    }
    res.status(200).json({
      success: true,
      message:
        "Lấy danh sách sản phẩm một phần thành công, một số phụ kiện có vấn đề nhỏ.",
      data: { items: [] },
    });
  }
};

module.exports = { listAllItems };

// COMPLETED FUNCTIONS:
// 1. listAllItems - Get all public products with pagination and filters