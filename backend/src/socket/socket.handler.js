const jwt = require('jsonwebtoken');
const Message = require('../models/Messages.model');
const Conversation = require('../models/Conversation.model');

const socketHandler = (io) => {
  // Authentication middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded._id;
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.id})`);

    // User joins their own room
    socket.join(`user_${socket.userId}`);

    // Listen for join conversation
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (
          !conversation.userId1.equals(socket.userId) &&
          !conversation.userId2.equals(socket.userId)
        ) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }

        // Join the conversation room
        socket.join(`conversation_${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);

        // Notify others in the conversation
        socket.to(`conversation_${conversationId}`).emit('user_joined', {
          userId: socket.userId,
          conversationId
        });
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Error joining conversation' });
      }
    });

    // Listen for send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;

        if (!conversationId || !content) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // Verify conversation exists
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Verify user is part of this conversation
        if (
          !conversation.userId1.equals(socket.userId) &&
          !conversation.userId2.equals(socket.userId)
        ) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Create message
        const message = await Message.create({
          conversationId,
          fromUserId: socket.userId,
          content
        });

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('fromUserId', 'fullName email avatarUrl');

        // Emit to all clients in this conversation
        io.to(`conversation_${conversationId}`).emit('new_message', populatedMessage);

        // Also emit to user's own room for confirmation
        socket.emit('message_sent', populatedMessage);

        console.log(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message', error: error.message });
      }
    });

    // Listen for typing indicators
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return;

        // Verify user is part of this conversation
        if (
          !conversation.userId1.equals(socket.userId) &&
          !conversation.userId2.equals(socket.userId)
        ) {
          return;
        }

        // Notify others in the conversation
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId: socket.userId,
          conversationId,
          isTyping
        });
      } catch (error) {
        console.error('Error handling typing:', error);
      }
    });

    // Listen for read receipt
    socket.on('mark_read', async (conversationId) => {
      try {
        // Verify user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        if (
          !conversation.userId1.equals(socket.userId) &&
          !conversation.userId2.equals(socket.userId)
        ) {
          return;
        }

        // Notify others that user has read messages
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          userId: socket.userId,
          conversationId
        });
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId} (${socket.id})`);
    });

    // Handle disconnect
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });
  });
};

module.exports = socketHandler;

