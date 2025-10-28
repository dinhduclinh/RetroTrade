import api from "../customizeAPI";
import { io, Socket } from "socket.io-client";

// API endpoints
export interface SendMessageParams {
  conversationId: string;
  content: string;
}

export interface Conversation {
  _id: string;
  userId1: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  userId2: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  fromUserId: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'moderator';
  userGuid?: string;
}

// REST API methods
export const sendMessage = async ({ conversationId, content }: SendMessageParams) => {
  return api.post(`/messages/send`, { conversationId, content });
};

export const getMessages = async (conversationId: string) => {
  return api.get(`/messages/${conversationId}`);
};

export const getConversations = async () => {
  return api.get(`/messages/conversations`);
};

export const getConversation = async (conversationId: string) => {
  return api.get(`/messages/conversations/${conversationId}`);
};

export const createConversation = async (targetUserId: string) => {
  return api.post(`/messages/conversations`, { targetUserId });
};

export const getStaff = async () => {
  return api.get(`/messages/staff`);
};

// Socket.IO connection management
let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (socket?.connected) return socket;

  // Extract base URL from API URL (remove /api/v1 if present)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';
  const baseUrl = apiUrl.replace(/\/api\/v1$/, '');
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || baseUrl || 'http://localhost:9999';
  
  socket = io(SOCKET_URL, {
    auth: {
      token: localStorage.getItem('token')
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

// Socket event handlers
export const socketHandlers = {
  // Join conversation
  joinConversation: (conversationId: string) => {
    socket?.emit('join_conversation', conversationId);
  },

  // Leave conversation
  leaveConversation: (conversationId: string) => {
    socket?.emit('leave_conversation', conversationId);
  },

  // Send message
  sendMessage: (conversationId: string, content: string) => {
    socket?.emit('send_message', { conversationId, content });
  },

  // Typing indicator
  setTyping: (conversationId: string, isTyping: boolean) => {
    socket?.emit('typing', { conversationId, isTyping });
  },

  // Mark as read
  markAsRead: (conversationId: string) => {
    socket?.emit('mark_read', conversationId);
  },

  // Listen for new messages
  onNewMessage: (callback: (message: Message) => void) => {
    socket?.on('new_message', callback);
  },

  // Listen for user joined
  onUserJoined: (callback: (data: { userId: string; conversationId: string }) => void) => {
    socket?.on('user_joined', callback);
  },

  // Listen for typing
  onTyping: (callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void) => {
    socket?.on('user_typing', callback);
  },

  // Listen for read receipt
  onMessagesRead: (callback: (data: { userId: string; conversationId: string }) => void) => {
    socket?.on('messages_read', callback);
  },

  // Listen for errors
  onError: (callback: (error: { message: string }) => void) => {
    socket?.on('error', callback);
  },

  // Remove listeners
  offNewMessage: () => {
    socket?.off('new_message');
  },

  offUserJoined: () => {
    socket?.off('user_joined');
  },

  offTyping: () => {
    socket?.off('user_typing');
  },

  offMessagesRead: () => {
    socket?.off('messages_read');
  },

  offError: () => {
    socket?.off('error');
  }
};
