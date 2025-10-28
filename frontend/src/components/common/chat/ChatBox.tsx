"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/router";
import {
  connectSocket,
  disconnectSocket,
  socketHandlers,
  getMessages,
  createConversation,
  getConversation,
  getConversations,
  getStaff,
  sendMessage as sendMessageAPI,
  Conversation,
  Message,
  StaffMember
} from "@/services/messages/messages.api";

interface DecodedToken {
  email: string;
  userGuid?: string;
  avatarUrl?: string;
  fullName?: string;
  _id?: string;
  exp: number;
  iat: number;
}

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ isOpen, onClose }) => {
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
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Load conversations when opened
  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
      connectSocket();

      // Listen for new messages
      socketHandlers.onNewMessage((message: Message) => {
        if (message.conversationId === selectedConversation?._id) {
          setMessages((prev) => [...prev, message]);
        }
      });

      return () => {
        socketHandlers.offNewMessage();
        disconnectSocket();
      };
    }
  }, [isOpen, user, selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await getConversations();
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadStaff = async () => {
    try {
      setLoadingStaff(true);
      const response = await getStaff();
      
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.data || []);
        setShowSupport(true);
      }
    } catch (error) {
      console.error("Error loading staff:", error);
    } finally {
      setLoadingStaff(false);
    }
  };

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

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId);
      if (response.ok) {
        const data = await response.json();
        const messagesList = Array.isArray(data) ? data : (data.data || []);
        setMessages(messagesList);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessageInput("");
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      socketHandlers.sendMessage(selectedConversation._id, messageInput.trim());
      await sendMessageAPI({
        conversationId: selectedConversation._id,
        content: messageInput.trim()
      });
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartConversationWithStaff = async (staffId: string) => {
    try {
      console.log("Starting conversation with staff:", staffId);
      const response = await createConversation(staffId);
      console.log("Create conversation response:", response);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Create conversation data:", data);
        
        // Get the conversation data
        const conversationData = data.data || data;
        console.log("Conversation data:", conversationData);
        
        setSelectedConversation(conversationData);
        console.log("Conversation set successfully");
      } else {
        console.error("Failed to create conversation:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error creating conversation with staff:", error);
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    if (!user) return null;
    
    // Compare by converting to string to handle ObjectId comparison
    const currentUserId = String(user._id || user.userGuid);
    const userId1 = String(conversation.userId1._id || conversation.userId1);
    const userId2 = String(conversation.userId2._id || conversation.userId2);
    
    return userId1 === currentUserId ? conversation.userId2 : conversation.userId1;
  };

  if (!isOpen) return null;

  const otherUser = selectedConversation ? getOtherUser(selectedConversation) : null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="w-[380px] h-[600px] bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {/* Back arrow - only show when in conversation */}
            {selectedConversation && (
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            )}

            {/* Title */}
            <div className="text-white font-medium text-sm">
              {selectedConversation ? otherUser?.fullName || "Chat" : "Messages"}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Expand to full page button */}
            <button
              onClick={() => router.push('/auth/messages')}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="Mở trang tin nhắn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="14" height="14" rx="2"/>
                <path d="M9 11l6 6M15 11l-6 6"/>
              </svg>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          {!selectedConversation ? (
            // Conversations List
            <div className="p-2">
              {loadingConversations ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Đang tải...
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Support Button */}
                  {!showSupport && (
                    <button
                      onClick={loadStaff}
                      disabled={loadingStaff}
                      className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2 text-white font-medium">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-6 0v4"/>
                          <path d="M9 14H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4"/>
                          <path d="M15 14h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"/>
                          <path d="M9 10H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"/>
                        </svg>
                        <span>Yêu cầu hỗ trợ</span>
                      </div>
                    </button>
                  )}

                  {/* Staff Members - only show when support requested */}
                  {showSupport && (
                    <div>
                      <div className="flex items-center justify-between px-2 mb-2">
                        <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                          Hỗ trợ
                        </div>
                        <button
                          onClick={() => {
                            setShowSupport(false);
                            setStaffMembers([]);
                          }}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      {loadingStaff ? (
                        <div className="text-gray-500 text-sm text-center py-4">Đang tải...</div>
                      ) : staffMembers.length > 0 ? (
                        staffMembers.map((staff) => (
                          <button
                            key={staff._id}
                            onClick={() => handleStartConversationWithStaff(staff._id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors text-left"
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                              {staff.avatarUrl ? (
                                <img
                                  src={staff.avatarUrl}
                                  alt={staff.fullName}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span className="text-white text-sm font-semibold">
                                  {staff.fullName?.charAt(0).toUpperCase() || "S"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium text-sm truncate flex items-center gap-2">
                                {staff.fullName}
                                <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                                  {staff.role === 'admin' ? 'Admin' : 'Mod'}
                                </span>
                              </div>
                              <div className="text-gray-400 text-xs truncate">
                                Nhân viên hỗ trợ
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm text-center py-4">
                          Không có nhân viên hỗ trợ
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty state for non-staff conversations */}
                  {(() => {
                    const staffIds = staffMembers.map(s => String(s._id));
                    const filteredConversations = conversations.filter(conv => {
                      const otherUser = getOtherUser(conv);
                      return otherUser && !staffIds.includes(String(otherUser._id));
                    });

                    // Show empty state only when NOT in support mode and no non-staff conversations
                    if (!showSupport && filteredConversations.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-32 text-gray-500">
                          <div className="text-center">
                            <div className="text-4xl mb-2">💬</div>
                            <div className="text-sm">Chưa có cuộc trò chuyện</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full text-gray-500 p-4">
              Đang tải tin nhắn...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 p-4">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <div className="text-sm">Chưa có tin nhắn</div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {messages.map((message, index) => {
                // Convert to string for comparison to handle ObjectId
                const messageUserId = String(message.fromUserId._id || message.fromUserId);
                const currentUserId = String(user?._id || user?.userGuid || "");
                const isOwnMessage = messageUserId === currentUserId;
                
                // Compare previous message's user
                const previousMessageUserId = index > 0 ? String(messages[index - 1].fromUserId._id || messages[index - 1].fromUserId) : "";
                const showAvatar = index === 0 || previousMessageUserId !== messageUserId;

                return (
                  <div
                    key={message._id}
                    className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    {!isOwnMessage && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        {message.fromUserId.avatarUrl ? (
                          <img
                            src={message.fromUserId.avatarUrl}
                            alt={message.fromUserId.fullName}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-white text-xs font-semibold">
                            {message.fromUserId.fullName?.charAt(0).toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? "bg-blue-500 text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                      style={{
                        marginLeft: !isOwnMessage && !showAvatar ? "40px" : "0",
                        marginRight: isOwnMessage && !showAvatar ? "40px" : "0"
                      }}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input - only show when in conversation */}
        {selectedConversation && (
          <div className="p-3 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-white transition-colors p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12h.01M12 12h.01M16 12h.01"/>
                </svg>
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message..."
                className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-1">
                <button className="text-gray-400 hover:text-white transition-colors p-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="8" y1="22" x2="16" y2="22"/>
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors p-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </button>
                <button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={messageInput.trim() ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    className={messageInput.trim() ? "text-blue-500" : "text-gray-500"}
                  >
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
