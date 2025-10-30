const ConversationModel = require("../../models/Conversation.model");
const MessagesModel = require("../../models/Messages.model");

// Hàm gửi tin nhắn trong cuộc trò chuyện
const sendMessages = async (req, res) => {
  try {
    // Lấy conversationId và nội dung tin nhắn từ yêu cầu client
    const { conversationId, content } = req.body;
    
    // Kiểm tra xem có đủ dữ liệu không
    if (!conversationId || !content)
      return res.status(400).json({ message: 'Thiếu trường dữ liệu' });

    // Tìm cuộc trò chuyện theo ID
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });

    // Lấy userId trong token (người gửi)
    const userId = req.user._id;
    
    // Kiểm tra người gửi có tham gia cuộc trò chuyện không
    if (!(conversation.userId1.equals(userId) || conversation.userId2.equals(userId))) {
      return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
    }

    // Tạo mới tin nhắn và lưu vào DB
    const message = await MessagesModel.create({
      conversationId,
      fromUserId: userId,
      content
    });

    // Populate sender info
    const populatedMessage = await MessagesModel.findById(message._id)
      .populate('fromUserId', 'fullName email avatarUrl');

    // Trả về tin nhắn vừa gửi
    res.status(201).json({
      code: 201,
      message: 'Gửi tin nhắn thành công',
      data: populatedMessage
    });
  } catch (err) {
    // Xử lý lỗi server
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Hàm lấy danh sách tin nhắn trong cuộc trò chuyện
const getMessages = async (req, res) => {
  try {
    // Lấy ID cuộc trò chuyện từ tham số URL
    const conversationId = req.params.conversationId;

    // Tìm cuộc trò chuyện
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });

    // Lấy userId người dùng hiện tại
    const userId = req.user._id;

    // Kiểm tra user có thuộc cuộc trò chuyện không
    if (!(conversation.userId1.equals(userId) || conversation.userId2.equals(userId))) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
    }

    // Lấy tất cả tin nhắn theo cuộc trò chuyện, sắp xếp theo thời gian tạo tăng dần
    const messages = await MessagesModel.find({ conversationId }).sort({ createdAt: 1 }).populate('fromUserId', 'fullName email avatarUrl');

    // Trả dữ liệu tin nhắn về client
    res.json({
      code: 200,
      message: 'Lấy tin nhắn thành công',
      data: messages
    });
  } catch (err) {
    // Xử lý lỗi server
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Hàm lấy danh sách conversations của user
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy tất cả conversations mà user tham gia
    const conversations = await ConversationModel.find({
      $or: [
        { userId1: userId },
        { userId2: userId }
      ]
    })
    .populate('userId1', 'fullName email avatarUrl')
    .populate('userId2', 'fullName email avatarUrl');

    // Lấy tin nhắn cuối cùng cho mỗi conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await MessagesModel.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .populate('fromUserId', 'fullName avatarUrl');

        return {
          ...conv.toObject(),
          lastMessage: lastMessage
        };
      })
    );

    // Sort by last message date (most recent first) or updatedAt if no message
    conversationsWithLastMessage.sort((a, b) => {
      const aDate = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
      const bDate = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
      return bDate - aDate;
    });

    res.json({
      code: 200,
      message: 'Lấy danh sách conversations thành công',
      data: conversationsWithLastMessage
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Hàm tạo conversation
const createConversation = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user._id;

    if (!targetUserId || targetUserId === userId) {
      return res.status(400).json({ message: 'User ID không hợp lệ' });
    }

    // Kiểm tra conversation đã tồn tại chưa
    let conversation = await ConversationModel.findOne({
      $or: [
        { userId1: userId, userId2: targetUserId },
        { userId1: targetUserId, userId2: userId }
      ]
    });

    if (conversation) {
      // Nếu đã có, trả về conversation đó
      await conversation.populate('userId1', 'fullName email avatarUrl');
      await conversation.populate('userId2', 'fullName email avatarUrl');
      return res.status(200).json({
        code: 200,
        message: 'Lấy cuộc trò chuyện thành công',
        data: conversation
      });
    }

    // Tạo conversation mới
    conversation = await ConversationModel.create({
      userId1: userId,
      userId2: targetUserId
    });

    await conversation.populate('userId1', 'fullName email avatarUrl');
    await conversation.populate('userId2', 'fullName email avatarUrl');

    res.status(201).json({
      code: 201,
      message: 'Tạo cuộc trò chuyện thành công',
      data: conversation
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Hàm lấy thông tin conversation
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await ConversationModel.findById(conversationId)
      .populate('userId1', 'fullName email avatarUrl')
      .populate('userId2', 'fullName email avatarUrl');

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    // Kiểm tra user có tham gia conversation không
    if (
      !conversation.userId1._id.equals(userId) &&
      !conversation.userId2._id.equals(userId)
    ) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    res.json({
      code: 200,
      message: 'Lấy conversation thành công',
      data: conversation
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

module.exports = {
    sendMessages,
    getMessages,
    getConversations,
    createConversation,
    getConversation
};
