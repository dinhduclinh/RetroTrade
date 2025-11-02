const ContractTemplate = require("../../models/ContractTemplate.model");

// Tạo mẫu hợp đồng
exports.createTemplate = async (req, res) => {
  try {
    const { templateName, description, templateContent } = req.body;
    const createdBy = req.user._id;

    const template = new ContractTemplate({
      templateName,
      description,
      templateContent,
      createdBy,
    });

    const savedTemplate = await template.save();

    res.status(201).json({
      message: "Mẫu hợp đồng được tạo thành công",
      templateId: savedTemplate._id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi tạo mẫu hợp đồng", details: error.message });
  }
};

// Lấy tất cả mẫu hợp đồng
exports.getTemplates = async (req, res) => {
  try {
    const templates = await ContractTemplate.find()
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ templates });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy danh sách mẫu hợp đồng",
      details: error.message,
    });
  }
};

// Lấy chi tiết mẫu hợp đồng
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await ContractTemplate.findById(id).populate(
      "createdBy",
      "fullName email"
    );

    if (!template) {
      return res.status(404).json({ message: "Mẫu hợp đồng không tồn tại" });
    }

    res.json({ template });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi lấy chi tiết mẫu hợp đồng",
      details: error.message,
    });
  }
};

// Cập nhật mẫu hợp đồng
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const template = await ContractTemplate.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user._id },
      { new: true }
    ).populate("createdBy", "fullName email");

    if (!template) {
      return res.status(404).json({ message: "Mẫu hợp đồng không tồn tại" });
    }

    res.json({
      message: "Mẫu hợp đồng được cập nhật thành công",
      template,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật mẫu hợp đồng", details: error.message });
  }
};

// Xóa mẫu hợp đồng
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await ContractTemplate.findByIdAndDelete(id);

    if (!template) {
      return res.status(404).json({ message: "Mẫu hợp đồng không tồn tại" });
    }

    res.json({ message: "Mẫu hợp đồng đã được xóa thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi xóa mẫu hợp đồng", details: error.message });
  }
};
