const PostCategory = require("../../models/Blog/PostCategory.model");

 const getAllCategories = async (req, res) => {
  try {
    const categories = await PostCategory.find({ isDeleted: false });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to load categories", error });
  }
};


 const createCategory = async (req, res) => {
  try {
    const category = await PostCategory.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: "Failed to create category", error });
  }
};


 const updateCategory = async (req, res) => {
  try {
    const category = await PostCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: "Failed to update category", error });
  }
};


 const deleteCategory = async (req, res) => {
  try {
    const category = await PostCategory.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category", error });
  }
};

module.exports = {getAllCategories,createCategory,updateCategory,deleteCategory};