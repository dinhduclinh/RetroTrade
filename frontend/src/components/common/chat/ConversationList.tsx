"use client";

import React, { useState, useEffect } from "react";
import { Conversation, getConversations } from "@/services/messages/messages.api";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  currentUserId: string;
  excludeUserIds?: string[]; // IDs to exclude from the list
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId,
  currentUserId,
  excludeUserIds = []
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
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
  }, []);

  const getOtherUser = (conversation: Conversation) => {
    return conversation.userId1._id === currentUserId ? conversation.userId2 : conversation.userId1;
  };

  // Filter out conversations with excluded users
  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherUser(conv);
    if (!otherUser || !otherUser._id) return true;
    return !excludeUserIds.includes(String(otherUser._id));
  });

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

  if (filteredConversations.length === 0) {
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
      {sortedConversations.map((conversation) => {
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
                {/* Online status (optional) */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 truncate">
                    {otherUser.fullName}
                  </span>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                        addSuffix: true,
                        locale: vi
                      })}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 truncate">
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

