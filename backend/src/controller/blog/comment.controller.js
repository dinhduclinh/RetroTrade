const Comment =  require("../../models/Blog/Comment.model");


 const getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({
      postId: req.params.postId,
      isDeleted: false,
    })
      .populate("userId", "fullName")
      .populate("parentCommentId", "content userId");
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to load comments", error });
  }
};
const getAllComment = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("userId", "fullName avatarUrl displayName") 
      .populate("postId", "title") 
      .populate("parentCommentId", "content userId") 
      .sort({ createdAt: -1 });

    const formattedComments = comments.map((c) => ({
      _id: c._id,
      content: c.content,
      user: c.userId,
      postTitle: c.postId?.title || "Unknown",
      parentComment: c.parentCommentId,
      isDeleted: c.isDeleted,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.status(200).json(formattedComments);
  } catch (error) {
    console.error("Error getting all comments:", error);
    res.status(500).json({ message: "Failed to load comments", error });
  }
};

// Lấy chi tiết một comment
const getCommentDetail = async (req, res) => {
  try {
    const { id } = req.params; 

  
    const comment = await Comment.findById(id)
      .populate("userId", "fullName avatarUrl displayName") 
      .populate("postId", "title") 
      .populate("parentCommentId", "content userId"); 

    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json({ comment });
  } catch (error) {
    console.error("Error getting comment detail:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { getCommentDetail };




const addComment = async (req, res) => {
  try {
    console.log("req.user:", req.user); 
    console.log("req.params.postId:", req.params.postId);
    console.log("req.body.content:", req.body.content);

    const comment = await Comment.create({
      postId: req.params.postId,
      userId: req.user._id,
      content: req.body.content,
      parentCommentId: req.body.parentCommentId || null,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error); // log chi tiết
    res.status(400).json({ message: "Failed to add comment", error });
  }
};


const banComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.isDeleted = !comment.isDeleted; 
    comment.updatedAt = Date.now();
    await comment.save();

    res.json({
      message: comment.isDeleted
        ? "Comment has been banned"
        : "Comment has been unbanned",
      comment,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle comment status", error });
  }
};



const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json({ message: "Comment deleted permanently" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete comment", error });
  }
};

module.exports = {getCommentsByPost , addComment, deleteComment , getAllComment,banComment ,getCommentDetail};