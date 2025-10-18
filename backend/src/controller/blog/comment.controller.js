const Comment =  require("../../models/Blog/Comment.model");


 const getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({
      postId: req.params.postId,
      isDeleted: false,
    })
      .populate("userId", "name")
      .populate("parentCommentId", "content userId");
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to load comments", error });
  }
};


const addComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      postId: req.params.postId,
      userId: req.user.id,
      content: req.body.content,
      parentCommentId: req.body.parentCommentId || null,
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: "Failed to add comment", error });
  }
};


const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete comment", error });
  }
};

module.exports = {getCommentsByPost , addComment, deleteComment};