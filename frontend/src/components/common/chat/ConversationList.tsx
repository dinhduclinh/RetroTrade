"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import { Conversation, getConversations, getStaff, StaffMember, createConversation } from "@/services/messages/messages.api";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";

interface ConversationListProps {
  conversations?: Conversation[]; // Optional: if provided, use it instead of loading
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  currentUserId: string;
  excludeUserIds?: string[]; // IDs to exclude from the list
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations: conversationsProp,
  onSelectConversation,
  selectedConversationId,
  currentUserId,
  excludeUserIds = []
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showSupport, setShowSupport] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Use conversations from props if provided, otherwise load from API
  useEffect(() => {
    if (conversationsProp) {
      setConversations(conversationsProp);
      setLoading(false);
    } else {
      const loadConversations = async () => {
        try {
          setLoading(true);
          const response = await getConversations();
          if (response.ok) {
            const data = await response.json();
            setConversations(data.data || []);
          } else {
            setError("Không thể tải danh sách cuộc trò chuyện");
          }
        } catch (err) {
          console.error("Error loading conversations:", err);
          setError("Lỗi khi tải cuộc trò chuyện");
        } finally {
          setLoading(false);
        }
      };
      loadConversations();
    }
  }, [conversationsProp]);

  const handleLoadStaff = async () => {
    try {
      setLoadingStaff(true);
      const res = await getStaff();
      if (res.ok) {
        const data = await res.json();
        setStaff(data.data || []);
        setShowSupport(true);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleStartConversationWithStaff = async (staffId: string) => {
    try {
      const res = await createConversation(staffId);
      if (res.ok) {
        const data = await res.json();
        const conversationData = data.data || data;
        onSelectConversation(conversationData);
        setShowSupport(false);
      }
    } catch (err) {
      console.error('Error creating conversation with staff:', err);
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.userId1._id === currentUserId ? conversation.userId2 : conversation.userId1;
  };

  const onlineByUserId = useSelector((state: RootState) => state.presence?.onlineByUserId || {});

  // Filter: exclude specific users and hide conversations without messages
  const filteredConversations = conversations
    .filter(conv => {
      const otherUser = getOtherUser(conv);
      if (!otherUser || !otherUser._id) return true;
      return !excludeUserIds.includes(String(otherUser._id));
    })
    .filter(conv => !!conv.lastMessage);

  const getLastMessagePreview = (conversation: Conversation) => {
    if (conversation.lastMessage) {
      return conversation.lastMessage.content.length > 40
        ? conversation.lastMessage.content.substring(0, 40) + "..."
        : conversation.lastMessage.content;
    }
    return "Bắt đầu cuộc trò chuyện";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  if (!showSupport && filteredConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
        <div className="text-4xl">💬</div>
        <div>Chưa có cuộc trò chuyện nào</div>
      </div>
    );
  }

  // Sort conversations by last message date (most recent first)
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aDate = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
    const bDate = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
    return bDate - aDate;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Support toggle */}
      <div className="p-2 border-b bg-white sticky top-0 z-10">
        {!showSupport ? (
          <button
            onClick={handleLoadStaff}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 9V5a3 3 0 0 0-6 0v4"/>
              <path d="M9 14H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4"/>
              <path d="M15 14h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"/>
              <path d="M9 10H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"/>
            </svg>
            <span>Yêu cầu hỗ trợ</span>
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold uppercase">Hỗ trợ</span>
            <button onClick={() => setShowSupport(false)} className="text-gray-400 hover:text-gray-700 text-sm">✕</button>
          </div>
        )}
      </div>

      {/* Staff list */}
      {showSupport && (
        <div className="p-2">
          {loadingStaff ? (
            <div className="text-gray-500 text-sm text-center py-4">Đang tải...</div>
          ) : staff.length > 0 ? (
            staff.map((s) => (
              <button
                key={s._id}
                onClick={() => handleStartConversationWithStaff(s._id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {s.avatarUrl ? (
                    <Image src={s.avatarUrl} alt={s.fullName} width={48} height={48} className="rounded-full" style={{ objectFit: 'cover' }} />
                  ) : (
                    <span className="text-white text-sm font-semibold">{s.fullName?.charAt(0).toUpperCase() || 'S'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 font-medium text-sm truncate flex items-center gap-2">
                    {s.fullName}
                    <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">{s.role === 'admin' ? 'Admin' : 'Mod'}</span>
                  </div>
                  <div className="text-gray-500 text-xs truncate">Nhân viên hỗ trợ</div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-gray-500 text-sm text-center py-4">Không có nhân viên hỗ trợ</div>
          )}
        </div>
      )}

      {/* Recent conversations (default) */}
      {!showSupport && sortedConversations.map((conversation) => {
        const otherUser = getOtherUser(conversation);
        const isSelected = selectedConversationId === conversation._id;

        return (
          <div
            key={conversation._id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 border-b cursor-pointer transition-colors ${
              isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {otherUser.avatarUrl ? (
                    <Image
                      src={otherUser.avatarUrl}
                      alt={otherUser.fullName}
                      width={48}
                      height={48}
                      className="rounded-full"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span>{otherUser.fullName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {/* Online status */}
                {otherUser?._id && (
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${onlineByUserId[String(otherUser._id)] ? 'bg-green-500' : 'bg-red-500'}`}></span>
                )}
              </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 truncate">
                        {otherUser.fullName}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(conversation.unreadCount ?? 0) > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount! > 9 ? "9+" : conversation.unreadCount}
                          </span>
                        )}
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                              addSuffix: true,
                              locale: vi
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm truncate ${(conversation.unreadCount ?? 0) > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {getLastMessagePreview(conversation)}
                    </div>
                  </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;

