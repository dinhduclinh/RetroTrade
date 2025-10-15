const Post = require("../../models/Blog/Post.model");
const PostCategory = require("../../models/Blog/PostCategory.model");
const Tag = require("../../models/Blog/Tag.model");
const Comment = require("../../models/Blog/Comment.model");

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ isActive: true })
      .populate("authorId", "name")
      .populate("categoryId", "name")
      .populate("tags", "name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to load posts", error });
  }
};


const getBlogDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findOne({ _id: id, isActive: true })
      .populate("authorId", "name email avatar")
      .populate("categoryId", "name description") 
      .populate("tags", "name") 
      .lean(); 

    if (!post) {
      return res.status(404).json({ message: "Bài viết không tồn tại" });
    }

 
    // const comments = await Comment.find({
    //   postId: post._id,
    //   isDeleted: false,
    // })
    //   .populate("userId", "name avatar")
    //   .populate("parentCommentId", "content userId")
    //   .sort({ createdAt: -1 })
    //   .lean();

  
    const blogDetail = {
      ...post,
      // comments,
    };

    res.json(blogDetail);
  } catch (error) {
    res.status(500).json({
      message: "Không thể tải chi tiết bài viết",
      error: error.message,
    });
  }
};




const createPost = async (req, res) => {
  try {
    const post = await Post.create(req.body);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: "Failed to create post", error });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: "Failed to update post", error });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post", error });
  }
};
const getPostsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 6 } = req.query;

    const filter = { isActive: true, categoryId };
    const skip = (page - 1) * limit;

    const posts = await Post.find(filter)
      .populate("authorId", "name avatar")
      .populate("categoryId", "name")
      .populate("tags", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load posts by category", error });
  }
};
const getPostsByTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { page = 1, limit = 6 } = req.query;

    const filter = { isActive: true, tags: { $in: [tagId] } };
    const skip = (page - 1) * limit;

    const posts = await Post.find(filter)
      .populate("authorId", "name avatar")
      .populate("categoryId", "name")
      .populate("tags", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load posts by tag", error });
  }
};


module.exports = {
  getAllPosts,
  getBlogDetail,
  createPost,
  updatePost,
  deletePost,
  getPostsByCategory,
  getPostsByTag,
};
