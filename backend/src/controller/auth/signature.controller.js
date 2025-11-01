const UserSignature = require("../../models/UserSignature.model");
const cloudinary = require("cloudinary").v2;
const { generateString } = require("../../utils/generateString");
const {
  encryptSignature,
  decryptSignature,
} = require("../../utils/cryptoHelper");
const AuditLog = require("../../models/AuditLog.model");

exports.createSignature = async (req, res) => {
  try {
    const userId = req.user._id;
    const { signatureData } = req.body; 

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized - User ID missing" });
    }
    if (!signatureData) {
      return res.status(400).json({ message: "Dữ liệu chữ ký không hợp lệ" });
    }

    const existingSignature = await UserSignature.findOne({
      userId,
      isActive: true,
    });

    const { iv, encryptedData } = encryptSignature(signatureData);
    const encryptedBuffer = Buffer.from(encryptedData, "hex");

    // Upload image mới lên Cloudinary
    const newPublicId = `sig_${userId}_${generateString(8)}`;
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        signatureData,
        {
          folder: "signatures",
          resource_type: "image",
          public_id: newPublicId,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    let operation = "INSERT";
    let signatureId = null;

    if (existingSignature) {
      const oldPublicId = existingSignature.signatureImagePath
        .split("/")
        .pop()
        ?.split(".")[0];
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: "image",
        });
      }

      const updatedSignature = await UserSignature.findOneAndUpdate(
        { userId, isActive: true },
        {
          signatureData: encryptedBuffer,
          iv,
          signatureImagePath: uploadResult.secure_url,
          validFrom: new Date(), 
          updatedAt: new Date(),
        },
        { new: true }
      );

      signatureId = updatedSignature._id;
      operation = "UPDATE";
    } else {
      // Tạo mới nếu chưa có
      const signature = new UserSignature({
        userId,
        signatureData: encryptedBuffer,
        iv,
        signatureImagePath: uploadResult.secure_url,
      });

      const savedSignature = await signature.save();
      signatureId = savedSignature._id;
    }

    if (AuditLog) {
      await AuditLog.create({
        TableName: "UserSignatures",
        PrimaryKeyValue: signatureId.toString(),
        Operation: operation,
        ChangedByUserId: userId,
        ChangedAt: new Date(),
        ChangeSummary: `Signature ${operation.toLowerCase()}d and encrypted`,
      });
    }

    res.status(201).json({
      message: "Chữ ký được cập nhật thành công",
      signatureUrl: uploadResult.secure_url,
      signatureId: signatureId,
    });
  } catch (error) {
    console.error("Create signature error:", error);
    res
      .status(500)
      .json({
        message: "Lỗi server khi cập nhật chữ ký",
        details: error.message,
      });
  }
};

exports.getSignature = async (req, res) => {
  try {
    const userId = req.user._id;

    const signature = await UserSignature.findOne({
      userId,
      isActive: true,
    }).select("signatureImagePath iv signatureData createdAt validTo isActive");

    if (!signature) {
      return res.status(404).json({ message: "Chưa có chữ ký" });
    }

    let decryptedData = null;
    if (typeof signature.signatureData === "string" || !signature.iv) {
      decryptedData = signature.signatureData;
      console.warn("Using legacy signature data (not encrypted)");
    } else {
      try {
        const encryptedHex = signature.signatureData.toString("hex");
        decryptedData = decryptSignature(encryptedHex, signature.iv);
      } catch (decryptError) {
        console.error(
          "Decrypt error (non-critical for preview):",
          decryptError
        );
        decryptedData = null;
      }
    }

    res.json({
      signatureUrl: signature.signatureImagePath,
      decryptedData: decryptedData || null,
      validTo: signature.validTo,
      isActive: signature.isActive,
    });
  } catch (error) {
    console.error("Get signature error:", error);
    res.status(500).json({ message: "Lỗi lấy chữ ký" });
  }
};

exports.deleteSignature = async (req, res) => {
  try {
    const userId = req.user._id;

    const signatureToDelete = await UserSignature.findOne({
      userId,
      isActive: true,
    });

    if (!signatureToDelete) {
      return res.status(404).json({ message: "Không tìm thấy chữ ký để xóa" });
    }

    const publicId = signatureToDelete.signatureImagePath
      .split("/")
      .pop()
      ?.split(".")[0];
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }

    const deletedId = signatureToDelete._id;
    await UserSignature.findByIdAndDelete(deletedId);

    // Log Audit: DELETE
    if (AuditLog) {
      await AuditLog.create({
        TableName: "UserSignatures",
        PrimaryKeyValue: deletedId.toString(),
        Operation: "DELETE",
        ChangedByUserId: userId,
        ChangedAt: new Date(),
        ChangeSummary: "Signature deleted and image removed",
      });
    }

    res.json({ message: "Chữ ký đã được xóa thành công" });
  } catch (error) {
    console.error("Delete signature error:", error);
    res.status(500).json({ message: "Lỗi xóa chữ ký" });
  }
};
