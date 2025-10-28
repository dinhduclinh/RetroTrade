"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/router";
import {
  connectSocket,
  disconnectSocket,
  socketHandlers,
  getMessages,
  getConversations,
  getStaff,
  sendMessage as sendMessageAPI,
  createConversation,
  Conversation,
  Message,
  StaffMember
} from "@/services/messages/messages.api";
import ConversationList from "@/components/common/chat/ConversationList";
import MessageList from "@/components/common/chat/MessageList";
import { Search } from "lucide-react";
import Image from "next/image";
import Head from "next/head";

interface DecodedToken {
  email: string;
  userGuid?: string;
  avatarUrl?: string;
  fullName?: string;
  _id?: string;
  exp: number;
  iat: number;
}

const MessagesPage = () => {
  const router = useRouter();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  // Decode user from token
  const user = useMemo(() => {
    if (typeof accessToken === "string" && accessToken.trim()) {
      try {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        return decoded;
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    }
    return null;
  }, [accessToken]);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [showSupport, setShowSupport] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (user === null && !accessToken) {
      router.push("/auth/login");
    }
  }, [user, accessToken, router]);

  // Load conversations and connect socket on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      connectSocket();
    }

    return () => {
      if (selectedConversation) {
        socketHandlers.leaveConversation(selectedConversation._id);
      }
      disconnectSocket();
    };
  }, [user]);

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  // Listen for new messages
  useEffect(() => {
    if (!user) return;

    socketHandlers.onNewMessage((message: Message) => {
      if (message.conversationId === selectedConversation?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socketHandlers.onTyping((data) => {
      const userId = user?._id || user?.userGuid;
      if (data.conversationId === selectedConversation?._id && data.userId !== userId) {
        setTypingUser(data.userId);
        setTimeout(() => setTypingUser(null), 3000);
      }
    });

    return () => {
      socketHandlers.offNewMessage();
      socketHandlers.offTyping();
    };
  }, [user, selectedConversation]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
      socketHandlers.joinConversation(selectedConversation._id);
    }

    return () => {
      if (selectedConversation) {
        socketHandlers.leaveConversation(selectedConversation._id);
      }
    };
  }, [selectedConversation]);

  const loadStaffMembers = async () => {
    try {
      const response = await getStaff();
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.data || []);
        setShowSupport(true);
      }
    } catch (error) {
      console.error("Error loading staff:", error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversationWithStaff = async (staffId: string) => {
    try {
      const response = await createConversation(staffId);
      if (response.ok) {
        const data = await response.json();
        const conversationData = data.data || data;
        setSelectedConversation(conversationData);
        setShowSupport(false);
        setStaffMembers([]);
      }
    } catch (error) {
      console.error("Error creating conversation with staff:", error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessageInput("");
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    const messageContent = messageInput.trim();
    setMessageInput(""); // Clear input immediately

    // Optimistic update: Add message to UI immediately
    const tempMessage: Message = {
      _id: `temp_${Date.now()}`,
      conversationId: selectedConversation._id,
      fromUserId: {
        _id: user._id || user.userGuid || "",
        fullName: user.fullName || "",
        email: user.email || ""
      } as any,
      content: messageContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add temporary message to messages list
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Send via Socket.IO for real-time
      socketHandlers.sendMessage(selectedConversation._id, messageContent);

      // Also send via REST API for persistence
      const response = await sendMessageAPI({
        conversationId: selectedConversation._id,
        content: messageContent
      });

      // Update with actual message from server (replaces temp message)
      if (response.ok) {
        const data = await response.json();
        const actualMessage = data.data || data;
        
        // Replace temp message with actual message
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id ? actualMessage : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove temp message on error
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== tempMessage._id)
      );
      // Restore input
      setMessageInput(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    if (!user) return null;
    // Compare by converting to string to handle ObjectId
    const currentUserId = String(user._id || user.userGuid);
    const userId1 = String(conversation.userId1._id || conversation.userId1);
    const userId2 = String(conversation.userId2._id || conversation.userId2);
    
    return userId1 === currentUserId ? conversation.userId2 : conversation.userId1;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tin nhắn | RetroTrade</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Tin nhắn</h1>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-180px)] flex">
            {/* Sidebar - Conversations */}
            <div className="w-1/3 border-r flex flex-col">
              {/* Search bar */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Support button */}
              <div className="p-3 border-b">
                {!showSupport ? (
                  <button
                    onClick={loadStaffMembers}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-6 0v4"/>
                      <path d="M9 14H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4"/>
                      <path d="M15 14h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"/>
                      <path d="M9 10H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"/>
                    </svg>
                    <span>Yêu cầu hỗ trợ</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowSupport(false);
                      setStaffMembers([]);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <span>✕ Đóng</span>
                  </button>
                )}
              </div>

              {/* Staff members or Conversations list */}
              <div className="flex-1 overflow-y-auto">
                {showSupport ? (
                  // Staff members list
                  <div className="p-2">
                    <div className="text-xs font-semibold px-3 mb-2 text-gray-500 uppercase tracking-wide">
                      Hỗ trợ
                    </div>
                    {staffMembers.length > 0 ? (
                      <div className="space-y-1">
                        {staffMembers.map((staff) => (
                          <button
                            key={staff._id}
                            onClick={() => handleStartConversationWithStaff(staff._id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                              {staff.avatarUrl ? (
                                <Image
                                  src={staff.avatarUrl}
                                  alt={staff.fullName}
                                  width={48}
                                  height={48}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white text-sm font-semibold">
                                  {staff.fullName?.charAt(0).toUpperCase() || "S"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-900 font-medium text-sm truncate flex items-center gap-2">
                                {staff.fullName}
                                <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                                  {staff.role === 'admin' ? 'Admin' : 'Mod'}
                                </span>
                              </div>
                              <div className="text-gray-500 text-xs truncate">
                                Nhân viên hỗ trợ
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm text-center py-8">
                        Không có nhân viên hỗ trợ
                      </div>
                    )}
                  </div>
                ) : (
                  // Conversations list - Only show when NOT in support mode
                  !showSupport && user && (
                    <ConversationList
                      onSelectConversation={handleSelectConversation}
                      selectedConversationId={selectedConversation?._id}
                      currentUserId={user._id || user.userGuid || ""}
                      excludeUserIds={staffMembers.map(s => String(s._id))}
                    />
                  )
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 bg-white">
                    {getOtherUser(selectedConversation) && (
                      <>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                          {getOtherUser(selectedConversation)?.avatarUrl ? (
                            <Image
                              src={getOtherUser(selectedConversation)!.avatarUrl!}
                              alt={getOtherUser(selectedConversation)!.fullName}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span>{getOtherUser(selectedConversation)!.fullName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-sm font-semibold text-gray-900">{getOtherUser(selectedConversation)?.fullName}</h2>
                          <p className="text-xs text-gray-500">Active now</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                          </button>
                          <button className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                              <circle cx="12" cy="13" r="4"/>
                            </svg>
                          </button>
                          <button className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 16v-4M12 8h.01"/>
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Đang tải tin nhắn...</div>
                      </div>
                    ) : (
                      <>
                        <MessageList messages={messages} currentUserId={user._id || user.userGuid || ""} />
                        {typingUser && (
                          <div className="flex items-start gap-2 px-4 pb-4">
                            <div className="flex gap-1 rounded-3xl bg-gray-200 px-4 py-3">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '-0.3s' }}></span>
                              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: '-0.15s' }}></span>
                              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Message input */}
                  <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="flex items-center gap-2">
                      <button className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </button>
                      <button className="h-9 w-9 shrink-0 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="18" x2="12" y2="22"/>
                          <line x1="8" y1="22" x2="16" y2="22"/>
                        </svg>
                      </button>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Enter Message"
                          className="h-11 w-full rounded-full border-0 bg-gray-100 pr-20 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pl-4"
                        />
                        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
                          <button className="h-7 w-7 rounded-full hover:bg-transparent flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </button>
                          <button
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                            className="h-7 w-7 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <line x1="22" y1="2" x2="11" y2="13"/>
                              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <div className="text-xl font-semibold">Chọn một cuộc trò chuyện</div>
                    <div className="text-sm mt-2">Hoặc bắt đầu cuộc trò chuyện mới</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessagesPage;

