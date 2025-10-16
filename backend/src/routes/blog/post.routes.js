const express = require("express");
const {
  PostController,
  PostCategoryController,
  TagController,
  CommentController,
} = require("../../controller/blog/index");

const router = express.Router();

router.get("/posts", PostController.getAllPosts);
router.get("/posts/:id", PostController.getBlogDetail);
router.get("/posts/category/:categoryId", PostController.getPostsByCategory);
router.get("/postS/tag/:tagId", PostController.getPostsByTag);
router.get("/categories", PostCategoryController.getAllCategories);
router.get("/tags", TagController.getAllTags);
router.get("/comments/:postId", CommentController.getCommentsByPost);

router.post("/posts", PostController.createPost);
router.put("/posts/:id", PostController.updatePost);
router.delete("/posts/:id", PostController.deletePost);

router.post("/categories", PostCategoryController.createCategory);
router.put("/categories/:id", PostCategoryController.updateCategory);
router.delete("/categories/:id", PostCategoryController.deleteCategory);

router.post("/tags", TagController.createTag);
router.put("/tags/:id", TagController.updateTag);
router.delete("/tags/:id", TagController.deleteTag);

router.post("/comments/:postId", CommentController.addComment);
router.delete("/comments/:id", CommentController.deleteComment);

module.exports = router; 
