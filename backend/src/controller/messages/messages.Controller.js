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
    const message = await Message.create({
      conversationId,
      fromUserId: userId,
      content
    });

    // Trả về tin nhắn vừa gửi
    res.status(201).json(message);
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
    const messages = await MessagesModel.find({ conversationId }).sort({ createdAt: 1 });

    // Trả dữ liệu tin nhắn về client
    res.json(messages);
  } catch (err) {
    // Xử lý lỗi server
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

module.exports = {
    sendMessages,
    getMessages
};
