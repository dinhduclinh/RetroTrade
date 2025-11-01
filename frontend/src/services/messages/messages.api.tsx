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
    role?: string;
  };
  userId2: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    role?: string;
  };
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number; // Number of unread messages
  lastReadBy?: {
    userId1?: string; // Last read timestamp for userId1
    userId2?: string; // Last read timestamp for userId2
  };
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
  // optional soft-delete/edit fields
  isDeleted?: boolean;
  deletedAt?: string;
  editedAt?: string;
  // Media fields
  mediaType?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  // Read status
  readBy?: string[]; // Array of user IDs who have read this message
}

export interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'moderator';
}

// REST API methods
export const sendMessage = async ({ conversationId, content }: SendMessageParams) => {
  return api.post(`/messages/send`, { conversationId, content });
};

export interface SendMediaParams {
  conversationId: string;
  content?: string;
  file: File;
}

export const sendMessageWithMedia = async ({ conversationId, content, file }: SendMediaParams) => {
  const formData = new FormData();
  formData.append('media', file);
  formData.append('conversationId', conversationId);
  if (content) {
    formData.append('content', content);
  }
  
  // Don't set Content-Type header - let browser set it automatically with boundary for FormData
  return api.post(`/messages/send-media`, formData);
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

export const updateMessage = async (messageId: string, content: string) => {
  return api.put(`/messages/message/${messageId}`, { content });
};

export const deleteMessage = async (messageId: string) => {
  return api.delete(`/messages/message/${messageId}`);
};

export const getStaff = async () => {
  return api.get(`/messages/staff`);
};

// Mark conversation as read
export const markAsRead = async (conversationId: string) => {
  return api.put(`/messages/conversations/${conversationId}/mark-read`);
};


// Socket.IO connection management
let socket: Socket | null = null;

export const connectSocket = (tokenFromRedux?: string): Socket => {
  if (socket?.connected) return socket;

  // Extract base URL from API URL (remove /api/v1 if present)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';
  const baseUrl = apiUrl.replace(/\/api\/v1$/, '');
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || baseUrl || 'http://localhost:9999';
  
  const rawToken = tokenFromRedux || ((typeof window !== 'undefined' && (localStorage.getItem('token') || localStorage.getItem('accessToken'))) || undefined);
  const authToken = typeof rawToken === 'string' ? rawToken.replace(/^Bearer\s+/i, '') : rawToken;

  if (typeof window !== 'undefined') {
    console.log('[socket] connecting to', SOCKET_URL);
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: authToken
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
    // Request current online users after connect
    socket?.emit('get_online_users');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('[socket] connect_error:', err?.message || err);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('reconnect_attempt', (n) => {
    console.log('[socket] reconnect_attempt', n);
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

  // Presence: request current online users
  requestOnlineUsers: () => {
    socket?.emit('get_online_users');
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

  // Presence listeners
  onUserOnline: (callback: (data: { userId: string }) => void) => {
    socket?.on('user_online', callback);
  },
  onUserOffline: (callback: (data: { userId: string }) => void) => {
    socket?.on('user_offline', callback);
  },
  onOnlineUsers: (callback: (userIds: string[]) => void) => {
    socket?.on('online_users', callback);
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
  },
  offPresence: () => {
    socket?.off('user_online');
    socket?.off('user_offline');
    socket?.off('online_users');
  },
};
