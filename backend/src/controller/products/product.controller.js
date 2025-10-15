const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

const Item = require("../../models/Product/Item.model");
const ItemImages = require("../../models/Product/ItemImage.model");
const ItemTag = require("../../models/Product/ItemTag.model");
const AuditLog = require("../../models/AuditLog.model");
const Categories = require("../../models/Categories.model");
const ItemConditions = require("../../models/Product/ItemConditions.model");
const PriceUnits = require("../../models/Product/PriceUnits.model");
const User = require("../../models/User.model");
const Tags = require("../../models/Tag.model");

const addProduct = async (req, res) => {
  try {
    const ownerId = req.user._id;
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res
        .status(400)
        .json({ success: false, message: "OwnerId không hợp lệ" });
    }

    let {
      Title,
      ShortDescription,
      Description,
      CategoryId,
      ConditionId,
      BasePrice,
      PriceUnitId,
      DepositAmount,
      MinRentalDuration,
      MaxRentalDuration,
      Currency = "VND",
      Quantity,
      Address,
      City,
      District,
      Tags: TagsInput = [],
      ImageUrls = [],
    } = req.body;

    Title = Title?.trim() || "";
    ShortDescription = ShortDescription?.trim() || "";
    Description = Description?.trim() || "";
    Address = Address?.trim() || "";
    City = City?.trim() || "";
    District = District?.trim() || "";

    let tagsArray = [];
    if (TagsInput) {
      if (Array.isArray(TagsInput)) {
        tagsArray = TagsInput.map((tag) => {
          if (typeof tag === "string") return tag.trim();
          return null;
        }).filter((tag) => tag !== null && tag !== undefined && tag.length > 0);
      } else if (typeof TagsInput === "string") {
        try {
          const parsedTags = JSON.parse(TagsInput);
          if (Array.isArray(parsedTags)) {
            tagsArray = parsedTags
              .map((tag) => {
                if (typeof tag === "string") return tag.trim();
                return null;
              })
              .filter(
                (tag) => tag !== null && tag !== undefined && tag.length > 0
              );
          }
        } catch (err) {
          tagsArray = TagsInput.split(",")
            .map((tag) => {
              if (typeof tag === "string") return tag.trim();
              return null;
            })
            .filter(
              (tag) => tag !== null && tag !== undefined && tag.length > 0
            );
        }
      }
    }

    if (
      !Title ||
      !BasePrice ||
      !DepositAmount ||
      !Quantity ||
      !CategoryId ||
      !ConditionId ||
      !PriceUnitId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu các trường bắt buộc: Title, BasePrice, DepositAmount, Quantity, CategoryId, ConditionId, PriceUnitId",
      });
    }

    const parsedQuantity = parseInt(Quantity);
    const parsedBasePrice = parseFloat(BasePrice);
    const parsedDepositAmount = parseFloat(DepositAmount);
    const parsedCategoryId = new mongoose.Types.ObjectId(CategoryId);
    const parsedConditionId = parseInt(ConditionId); 
    const parsedPriceUnitId = parseInt(PriceUnitId); 
    const parsedMinDuration = MinRentalDuration
      ? parseInt(MinRentalDuration)
      : null;
    const parsedMaxDuration = MaxRentalDuration
      ? parseInt(MaxRentalDuration)
      : null;

    if (
      parsedQuantity < 1 ||
      parsedBasePrice <= 0 ||
      parsedDepositAmount <= 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Giá trị không hợp lệ" });
    }

    if (
      parsedMinDuration &&
      parsedMaxDuration &&
      parsedMinDuration > parsedMaxDuration
    ) {
      return res.status(400).json({
        success: false,
        message: "MinRentalDuration không thể vượt quá MaxRentalDuration",
      });
    }

    const category = await Categories.findById(parsedCategoryId);
    if (!category || !category.isActive)
      return res.status(400).json({
        success: false,
        message: "Danh mục không hợp lệ hoặc không hoạt động",
      });

    const condition = await ItemConditions.findOne({
      ConditionId: parsedConditionId,
    });
    if (!condition || condition.IsDeleted)
      return res
        .status(400)
        .json({ success: false, message: "Điều kiện không hợp lệ" });

    const priceUnit = await PriceUnits.findOne({ UnitId: parsedPriceUnitId });
    if (!priceUnit || priceUnit.IsDeleted)
      return res
        .status(400)
        .json({ success: false, message: "Đơn vị giá không hợp lệ" });

    const owner = await User.findById(ownerId);
    
    const newItem = await Item.create({
      ItemGuid: uuidv4(),
      OwnerId: ownerId,
      Title,
      ShortDescription,
      Description,
      CategoryId: parsedCategoryId,
      ConditionId: parsedConditionId,
      BasePrice: parsedBasePrice,
      PriceUnitId: parsedPriceUnitId,
      DepositAmount: parsedDepositAmount,
      MinRentalDuration: parsedMinDuration,
      MaxRentalDuration: parsedMaxDuration,
      Currency,
      Quantity: parsedQuantity,
      StatusId: 1,
      Address,
      City,
      District,
      IsHighlighted: false,
      IsTrending: false,
      ViewCount: 0,
      FavoriteCount: 0,
      RentCount: 0,
      IsDeleted: false,
    });

    let images = [];
    if (Array.isArray(ImageUrls) && ImageUrls.length > 0) {
      for (let i = 0; i < ImageUrls.length; i++) {
        const url = ImageUrls[i]; 
        if (typeof url !== "string" || !url.trim()) continue; 
        const image = await ItemImages.create({
          ItemId: newItem._id,
          Url: url.trim(),
          IsPrimary: i === 0, 
          Ordinal: i + 1,
          AltText: `${Title} - Image ${i + 1}`,
          IsDeleted: false,
        });
        images.push(image);
      }
    }

    // Handle Tags 
    let tagDocs = [];
    if (tagsArray.length > 0) {
      for (let tagName of tagsArray) {
        if (
          !tagName ||
          typeof tagName !== "string" ||
          tagName.trim().length === 0
        )
          continue;
        const trimmedName = tagName.trim();
        const tag = await Tags.findOneAndUpdate(
          { Name: trimmedName, IsDeleted: false },
          { Name: trimmedName, IsDeleted: false },
          { upsert: true, new: true }
        );
        if (tag && mongoose.Types.ObjectId.isValid(tag._id)) {
          const existingItemTag = await ItemTag.findOne({
            ItemId: newItem._id,
            TagId: tag._id,
            IsDeleted: false,
          });
          if (!existingItemTag) {
            const itemTag = await ItemTag.create({
              ItemId: newItem._id,
              TagId: tag._id,
              IsDeleted: false,
            });
            tagDocs.push(itemTag);
          }
        }
      }
    }

    // Audit log
    await AuditLog.create({
      TableName: "Items",
      PrimaryKeyValue: newItem._id.toString(),
      Operation: "INSERT",
      ChangedByUserId: ownerId,
      ChangeSummary: `Added new product: ${Title}`,
    });

    const itemWithDetails = {
      ...newItem.toObject(),
      Category: category,
      Condition: condition,
      Owner: owner,
      Images: images,
      Tags: tagDocs,
    };

    res.status(201).json({
      success: true,
      message: "Sản phẩm đã được tạo thành công và đang chờ phê duyệt.",
      data: itemWithDetails,
    });
  } catch (error) {
    console.error("Lỗi khi tạo sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo sản phẩm",
      error: error.message,
    });
  }
};

module.exports = { addProduct };
