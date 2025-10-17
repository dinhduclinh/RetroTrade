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

const cloudinary = require("cloudinary").v2;

const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split("/upload/");
  if (parts.length !== 2) return null;

  const afterUpload = parts[1].split("/").slice(1).join("/");
  const publicId = afterUpload ? afterUpload.split(".")[0] : null;
  return publicId ? `retrotrade/${publicId}` : null;
};

const addProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let success = false;
  let committed = false;
  try {
    const ownerId = req.user._id;
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      throw new Error("OwnerId không hợp lệ");
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
    if (TagsInput && Array.isArray(TagsInput)) {
      tagsArray = TagsInput.map((tag) =>
        typeof tag === "string" ? tag.trim() : null
      ).filter(
        (tag) =>
          tag !== null && tag !== undefined && tag !== "" && tag.length > 0
      );
    } else if (typeof TagsInput === "string" && TagsInput.trim()) {
      tagsArray = TagsInput.split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "" && tag.length > 0);
    }
    console.log("Processed tagsArray:", tagsArray);

    if (
      !Title ||
      !BasePrice ||
      !DepositAmount ||
      !Quantity ||
      !CategoryId ||
      !ConditionId ||
      !PriceUnitId
    ) {
      throw new Error(
        "Thiếu các trường bắt buộc: Title, BasePrice, DepositAmount, Quantity, CategoryId, ConditionId, PriceUnitId"
      );
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
      throw new Error("Giá trị không hợp lệ");
    }

    if (
      parsedMinDuration &&
      parsedMaxDuration &&
      parsedMinDuration > parsedMaxDuration
    ) {
      throw new Error("MinRentalDuration không thể vượt quá MaxRentalDuration");
    }

    const category = await Categories.findById(parsedCategoryId).session(
      session
    );
    if (!category || !category.isActive) {
      throw new Error("Danh mục không hợp lệ hoặc không hoạt động");
    }

    const condition = await ItemConditions.findOne({
      ConditionId: parsedConditionId,
    }).session(session);
    if (!condition || condition.IsDeleted) {
      throw new Error("Điều kiện không hợp lệ");
    }

    const priceUnit = await PriceUnits.findOne({
      UnitId: parsedPriceUnitId,
    }).session(session);
    if (!priceUnit || priceUnit.IsDeleted) {
      throw new Error("Đơn vị giá không hợp lệ");
    }

    const owner = await User.findById(ownerId).session(session);

    const newItem = await Item.create(
      [
        {
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
        },
      ],
      { session }
    );
    const item = newItem[0];
    success = true;

    let images = [];
    if (Array.isArray(ImageUrls) && ImageUrls.length > 0) {
      try {
        for (let i = 0; i < ImageUrls.length; i++) {
          const url = ImageUrls[i];
          if (typeof url !== "string" || !url.trim()) continue;
          const image = await ItemImages.create(
            [
              {
                ItemId: item._id,
                Url: url.trim(),
                IsPrimary: i === 0,
                Ordinal: i + 1,
                AltText: `${Title} - Image ${i + 1}`,
                IsDeleted: false,
              },
            ],
            { session }
          );
          images.push(image[0]);
        }
      } catch (imgError) {
        console.warn(
          "Images creation partial fail, continuing:",
          imgError.message
        );
      }
    }

    // Process tags
    if (tagsArray.length > 0) {
      await ItemTag.deleteMany({ ItemId: item._id }, { session }); // Hard delete all existing ItemTags

      for (let tagName of tagsArray) {
        const trimmedName = tagName.trim();
        if (!trimmedName || trimmedName.length === 0) {
          continue;
        }

        try {
          let tag = await Tags.findOne({
            name: trimmedName,
            isDeleted: false,
          }).session(session);

          if (!tag) {
            const newTag = await Tags.create(
              [{ name: trimmedName, isDeleted: false }],
              {
                session,
              }
            );
            tag = newTag[0];
          }

          if (tag && mongoose.Types.ObjectId.isValid(tag._id)) {
            await ItemTag.create(
              [
                {
                  ItemId: item._id,
                  TagId: tag._id,
                  IsDeleted: false,
                },
              ],
              { session }
            );
          }
        } catch (tagError) {
          console.warn(
            `Tag/ItemTag partial fail for "${trimmedName}", continuing:`,
            tagError.message
          );
        }
      }
    }

    // Audit log
    try {
      await AuditLog.create(
        [
          {
            TableName: "Items",
            PrimaryKeyValue: item._id.toString(),
            Operation: "INSERT",
            ChangedByUserId: ownerId,
            ChangeSummary: `Added new product: ${Title}`,
          },
        ],
        { session }
      );
    } catch (auditError) {
      console.warn("Audit log fail, continuing:", auditError.message);
    }

    await session.commitTransaction();
    committed = true;

    // Fetch updated item with details including current tags
    const updatedItemWithDetails = await Item.findById(item._id).session(
      session
    );
    const categoryDetail = await Categories.findById(parsedCategoryId).session(
      session
    );
    const conditionDetail = await ItemConditions.findOne({
      ConditionId: parsedConditionId,
    }).session(session);
    const ownerDetail = await User.findById(ownerId).session(session);
    const imagesDetail = await ItemImages.find({
      ItemId: item._id,
      IsDeleted: false,
    })
      .sort({ Ordinal: 1 })
      .session(session);
    const itemTagsDetail = await ItemTag.find({
      ItemId: item._id,
      IsDeleted: false,
    })
      .populate("TagId")
      .session(session);

    const itemWithDetails = {
      ...updatedItemWithDetails.toObject(),
      Category: categoryDetail,
      Condition: conditionDetail,
      Owner: ownerDetail,
      Images: imagesDetail,
      Tags: itemTagsDetail,
    };

    res.status(201).json({
      success: true,
      message: "Sản phẩm đã được tạo thành công và đang chờ phê duyệt.",
      data: itemWithDetails,
    });
  } catch (error) {
    if (!committed) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Abort transaction error:", abortError);
      }
    }
    console.error("Lỗi khi tạo sản phẩm:", error);
    if (!success) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi tạo sản phẩm",
      });
    }
    res.status(201).json({
      success: true,
      message:
        "Sản phẩm được tạo, một số phụ kiện (tags/images) có vấn đề nhỏ.",
      data: { itemId: req.body.ItemId || "partial" },
    });
  } finally {
    session.endSession();
  }
};

const updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let success = false;
  let committed = false;
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID sản phẩm không hợp lệ");
    }

    const existingItem = await Item.findOne({
      _id: id,
      OwnerId: userId,
      IsDeleted: false,
    }).session(session);
    if (!existingItem) {
      throw new Error(
        "Sản phẩm không tồn tại hoặc bạn không có quyền chỉnh sửa"
      );
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

    Title = Title?.trim() || existingItem.Title;
    ShortDescription =
      ShortDescription?.trim() || existingItem.ShortDescription;
    Description = Description?.trim() || existingItem.Description;
    Address = Address?.trim() || existingItem.Address;
    City = City?.trim() || existingItem.City;
    District = District?.trim() || existingItem.District;

    let tagsArray = [];
    if (TagsInput && Array.isArray(TagsInput)) {
      tagsArray = TagsInput.map((tag) =>
        typeof tag === "string" ? tag.trim() : null
      ).filter(
        (tag) =>
          tag !== null && tag !== undefined && tag !== "" && tag.length > 0
      );
    } else if (typeof TagsInput === "string" && TagsInput.trim()) {
      tagsArray = TagsInput.split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "" && tag.length > 0);
    }
    console.log("Processed tagsArray for update:", tagsArray);

    if (
      !Title ||
      !BasePrice ||
      !DepositAmount ||
      !Quantity ||
      !CategoryId ||
      !ConditionId ||
      !PriceUnitId
    ) {
      throw new Error(
        "Thiếu các trường bắt buộc: Title, BasePrice, DepositAmount, Quantity, CategoryId, ConditionId, PriceUnitId"
      );
    }

    const parsedQuantity = parseInt(Quantity);
    const parsedBasePrice = parseFloat(BasePrice);
    const parsedDepositAmount = parseFloat(DepositAmount);
    const parsedCategoryId = new mongoose.Types.ObjectId(CategoryId);
    const parsedConditionId = parseInt(ConditionId);
    const parsedPriceUnitId = parseInt(PriceUnitId);
    const parsedMinDuration = MinRentalDuration
      ? parseInt(MinRentalDuration)
      : existingItem.MinRentalDuration;
    const parsedMaxDuration = MaxRentalDuration
      ? parseInt(MaxRentalDuration)
      : existingItem.MaxRentalDuration;

    if (
      parsedQuantity < 1 ||
      parsedBasePrice <= 0 ||
      parsedDepositAmount <= 0
    ) {
      throw new Error("Giá trị không hợp lệ");
    }

    if (
      parsedMinDuration &&
      parsedMaxDuration &&
      parsedMinDuration > parsedMaxDuration
    ) {
      throw new Error("MinRentalDuration không thể vượt quá MaxRentalDuration");
    }

    const category = await Categories.findById(parsedCategoryId).session(
      session
    );
    if (!category || !category.isActive) {
      throw new Error("Danh mục không hợp lệ hoặc không hoạt động");
    }

    const condition = await ItemConditions.findOne({
      ConditionId: parsedConditionId,
    }).session(session);
    if (!condition || condition.IsDeleted) {
      throw new Error("Điều kiện không hợp lệ");
    }

    const priceUnit = await PriceUnits.findOne({
      UnitId: parsedPriceUnitId,
    }).session(session);
    if (!priceUnit || priceUnit.IsDeleted) {
      throw new Error("Đơn vị giá không hợp lệ");
    }

    const owner = await User.findById(userId).session(session);

    const updateData = {
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
      AvailableQuantity: parsedQuantity,
      Address,
      City,
      District,
      UpdatedAt: new Date(),
    };

    const updatedItem = await Item.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      session,
    });
    success = true;

    let images = [];
    if (Array.isArray(ImageUrls) && ImageUrls.length > 0) {
      try {
        const oldImages = await ItemImages.find({
          ItemId: updatedItem._id,
          IsDeleted: false,
        }).session(session);
        const deletePromises = oldImages.map(async (oldImage) => {
          await ItemImages.findByIdAndDelete(oldImage._id, { session });

          // Xóa khỏi Cloudinary
          const publicId = extractPublicId(oldImage.Url);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
            } catch (cloudErr) {
              console.error(
                "Lỗi xóa hình ảnh cũ trên Cloudinary:",
                cloudErr.message
              );
            }
          }
        });
        await Promise.all(deletePromises);

        // Tạo hình ảnh mới
        for (let i = 0; i < ImageUrls.length; i++) {
          const url = ImageUrls[i];
          if (typeof url !== "string" || !url.trim()) continue;
          const image = await ItemImages.create(
            [
              {
                ItemId: updatedItem._id,
                Url: url.trim(),
                IsPrimary: i === 0,
                Ordinal: i + 1,
                AltText: `${Title} - Image ${i + 1}`,
                IsDeleted: false,
              },
            ],
            { session }
          );
          images.push(image[0]);
        }
      } catch (imgError) {
        console.warn(
          "Images update partial fail, continuing:",
          imgError.message
        );
      }
    }

    // Process tags
    if (tagsArray.length > 0) {
      // Hard delete all existing ItemTags
      await ItemTag.deleteMany({ ItemId: updatedItem._id }, { session });

      for (let tagName of tagsArray) {
        const trimmedName = tagName.trim();
        if (!trimmedName || trimmedName.length === 0) {
          continue;
        }

        try {
          let tag = await Tags.findOne({
            name: trimmedName,
            isDeleted: false,
          }).session(session);

          if (!tag) {
            const newTag = await Tags.create(
              [{ name: trimmedName, isDeleted: false }],
              {
                session,
              }
            );
            tag = newTag[0];
          }

          if (tag && mongoose.Types.ObjectId.isValid(tag._id)) {
            await ItemTag.create(
              [
                {
                  ItemId: updatedItem._id,
                  TagId: tag._id,
                  IsDeleted: false,
                },
              ],
              { session }
            );
          }
        } catch (tagError) {
          console.warn(
            `Tag/ItemTag partial fail for "${trimmedName}", continuing:`,
            tagError.message
          );
        }
      }
    } else {
      // If no tags, remove all active ItemTags
      await ItemTag.updateMany(
        {
          ItemId: updatedItem._id,
          IsDeleted: false,
        },
        { IsDeleted: true },
        { session }
      );
    }

    // Audit log
    try {
      await AuditLog.create(
        [
          {
            TableName: "Items",
            PrimaryKeyValue: updatedItem._id.toString(),
            Operation: "UPDATE",
            ChangedByUserId: userId,
            ChangeSummary: `Updated product: ${Title}`,
          },
        ],
        { session }
      );
    } catch (auditError) {
      console.warn("Audit log fail, continuing:", auditError.message);
    }

    await session.commitTransaction();
    committed = true;

    // Fetch updated item with details including current tags
    const updatedItemWithDetails = await Item.findById(updatedItem._id).session(
      session
    );
    const categoryDetail = await Categories.findById(parsedCategoryId).session(
      session
    );
    const conditionDetail = await ItemConditions.findOne({
      ConditionId: parsedConditionId,
    }).session(session);
    const ownerDetail = await User.findById(userId).session(session);
    const imagesDetail = await ItemImages.find({
      ItemId: updatedItem._id,
      IsDeleted: false,
    })
      .sort({ Ordinal: 1 })
      .session(session);
    const itemTagsDetail = await ItemTag.find({
      ItemId: updatedItem._id,
      IsDeleted: false,
    })
      .populate("TagId")
      .session(session);

    const itemWithDetails = {
      ...updatedItemWithDetails.toObject(),
      Category: categoryDetail,
      Condition: conditionDetail,
      Owner: ownerDetail,
      Images: imagesDetail || images, // Fallback to new images if query fails
      Tags: itemTagsDetail,
    };

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: itemWithDetails,
    });
  } catch (error) {
    if (!committed) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Abort transaction error:", abortError);
      }
    }
    console.error("Lỗi cập nhật sản phẩm:", error);
    if (!success) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi cập nhật sản phẩm",
      });
    }
    res.status(200).json({
      success: true,
      message:
        "Cập nhật sản phẩm một phần thành công, một số phụ kiện có vấn đề nhỏ.",
      data: { itemId: id },
    });
  } finally {
    session.endSession();
  }
};

const deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let success = false;
  let committed = false;
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID sản phẩm không hợp lệ");
    }

    const existingItem = await Item.findOne({
      _id: id,
      OwnerId: userId,
      IsDeleted: false,
    }).session(session);
    if (!existingItem) {
      throw new Error("Sản phẩm không tồn tại hoặc bạn không có quyền xóa");
    }

    await Item.findByIdAndUpdate(
      id,
      { IsDeleted: true, UpdatedAt: new Date() },
      { session }
    );
    success = true;

    const images = await ItemImages.find({
      ItemId: id,
      IsDeleted: false,
    }).session(session);
    const deletePromises = images.map(async (image) => {
      await ItemImages.findByIdAndDelete(image._id, { session });

      // Xóa khỏi Cloudinary
      const publicId = extractPublicId(image.Url);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Đã xóa hình ảnh trên Cloudinary: ${publicId}`);
        } catch (cloudErr) {
          console.error("Lỗi xóa hình ảnh trên Cloudinary:", cloudErr.message);
        }
      }
    });
    await Promise.all(deletePromises);

    await ItemTag.deleteMany({ ItemId: id }, { session });

    // Audit log
    try {
      await AuditLog.create(
        [
          {
            TableName: "Items",
            PrimaryKeyValue: id.toString(),
            Operation: "DELETE",
            ChangedByUserId: userId,
            ChangeSummary: `Deleted product: ${existingItem.Title}`,
          },
        ],
        { session }
      );
    } catch (auditError) {
      console.warn("Audit log fail, continuing:", auditError.message);
    }

    await session.commitTransaction();
    committed = true;

    res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công",
      data: { deletedItemId: id },
    });
  } catch (error) {
    if (!committed) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Abort transaction error:", abortError);
      }
    }
    console.error("Lỗi xóa sản phẩm:", error);
    if (!success) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi xóa sản phẩm",
      });
    }
    res.status(200).json({
      success: true,
      message:
        "Xóa sản phẩm một phần thành công, một số phụ kiện có vấn đề nhỏ.",
      data: { deletedItemId: id },
    });
  } finally {
    session.endSession();
  }
};

const getUserProducts = async (req, res) => {
  let success = false;
  try {
    const userId = req.user._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("UserId không hợp lệ");
    }

    const items = await Item.find({ OwnerId: userId, IsDeleted: false })
      .sort({ CreatedAt: -1 })
      .lean();

    if (!items || items.length === 0) {
      success = true;
      return res.status(200).json({
        success: true,
        message: "Không có sản phẩm nào",
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

    const owner = await User.findById(userId)
      .select("FullName DisplayName AvatarUrl")
      .lean();

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
        Owner: owner,
        Images: imagesMap[item._id.toString()] || [],
        Tags: tagsMap[item._id.toString()] || [],
      }))
      .filter((item) => item.Category);

    success = true;

    res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm của người dùng thành công",
      data: {
        items: itemsWithDetails,
        total: itemsWithDetails.length,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy sản phẩm của người dùng:", error);
    if (!success) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy sản phẩm của người dùng",
      });
    }
    res.status(200).json({
      success: true,
      message:
        "Lấy sản phẩm một phần thành công, một số phụ kiện có vấn đề nhỏ.",
      data: { items: [] },
    });
  }
};

const getProductById = async (req, res) => {
  let success = false;
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID sản phẩm không hợp lệ");
    }

    const item = await Item.findOne({
      _id: id,
      OwnerId: userId,
      IsDeleted: false,
    }).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại hoặc bạn không có quyền xem",
      });
    }

    const images = await ItemImages.find({
      ItemId: id,
      IsDeleted: false,
    })
      .sort({ Ordinal: 1 })
      .lean();

    const itemTags = await ItemTag.find({
      ItemId: id,
      IsDeleted: false,
    }).lean();
    const tagIds = itemTags.map((tag) => tag.TagId);
    const tags = await Tags.find({
      _id: { $in: tagIds },
      isDeleted: false,
    }).lean();
    const category = await Categories.findOne({
      _id: item.CategoryId,
      isActive: true,
    }).lean();

    const condition = await ItemConditions.findOne({
      ConditionId: item.ConditionId,
      IsDeleted: false,
    }).lean();
    const priceUnit = await PriceUnits.findOne({
      UnitId: item.PriceUnitId,
      IsDeleted: false,
    }).lean();

    const owner = await User.findById(userId)
      .select("FullName DisplayName AvatarUrl")
      .lean();

    const fullTags = itemTags.map((itemTag) => ({
      ...itemTag,
      Tag: tags.find((t) => t._id.toString() === itemTag.TagId.toString()),
    }));

    const productWithDetails = {
      ...item,
      Category: category,
      Condition: condition,
      PriceUnit: priceUnit,
      Owner: owner,
      Images: images,
      Tags: fullTags,
    };

    success = true;

    res.status(200).json({
      success: true,
      message: "Lấy chi tiết sản phẩm thành công",
      data: productWithDetails,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    if (!success) {
      return res.status(500).json({
        success: false,
        message: error.message || "Lỗi server khi lấy chi tiết sản phẩm",
      });
    }
    res.status(200).json({
      success: true,
      message: "Lấy chi tiết sản phẩm một phần thành công.",
      data: null,
    });
  }
};

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getProductById,
};
