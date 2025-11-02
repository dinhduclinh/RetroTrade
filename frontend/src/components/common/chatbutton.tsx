"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import Image from "next/image";
import ChatBox from "./chat/ChatBox";
import { Conversation, getConversations } from "@/services/messages/messages.api";
import { decodeToken, getUserInitial } from "@/utils/jwtHelper";

type ChatButtonProps = {
  badgeCount?: number;
};

const ChatFloatingButton: React.FC<ChatButtonProps> = ({ badgeCount = 0 }) => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialConversations, setInitialConversations] = useState<Conversation[]>([]);

  // Decode user from token with memoization
  const decodedUser = useMemo(() => decodeToken(accessToken), [accessToken]);

  // Calculate total unread messages count from all conversations
  const totalUnreadCount = useMemo(() => {
    const total = initialConversations.reduce((sum, conversation) => {
      return sum + (conversation.unreadCount || 0);
    }, 0);
    return total;
  }, [initialConversations]);

  // Use computed unread count or fallback to badgeCount prop
  const displayBadgeCount = totalUnreadCount > 0 ? totalUnreadCount : badgeCount;

  const handleToggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  // Load conversations function
  const loadConversations = useCallback(async () => {
    if (!decodedUser) return;

    try {
      const res = await getConversations();
      
      if (res.ok) {
        const data = await res.json();
        if (data?.data) {
          setInitialConversations(Array.isArray(data.data) ? data.data : []);
        }
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setInitialConversations([]);
    }
  }, [decodedUser]);

  // Prefetch recent conversations so history is ready when opening the chat
  useEffect(() => {
    if (!decodedUser) return;

    let mounted = true;
    let abortController: AbortController | null = null;
    let refreshInterval: NodeJS.Timeout | null = null;

    const loadRecent = async () => {
      if (!decodedUser || isChatOpen) return; // Don't load if chat is already open
      
      try {
        abortController = new AbortController();
        await loadConversations();
      } catch (error) {
        if (mounted) {
          console.error("Failed to load conversations:", error);
        }
      }
    };

    // Load initially when chat is closed
    if (!isChatOpen) {
      loadRecent();
      
      // Refresh conversations every 30 seconds to update unread count
      refreshInterval = setInterval(() => {
        if (mounted && !isChatOpen) {
          loadRecent();
        }
      }, 30000); // 30 seconds
    }

    return () => {
      mounted = false;
      abortController?.abort();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [decodedUser, isChatOpen, loadConversations]);

  // Refresh conversations when chat closes to update unread count
  useEffect(() => {
    if (!isChatOpen && decodedUser) {
      // Small delay to ensure chat is fully closed
      const timeoutId = setTimeout(() => {
        loadConversations();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isChatOpen, decodedUser, loadConversations]);

  // Don't show button if user not logged in
  if (!decodedUser) {
    return null;
  }

  // Don't show button for moderator or admin (they have their own chat page)
  if (decodedUser.role === "moderator" || decodedUser.role === "admin") {
    return null;
  }

  return (
    <>
      {/* Floating Messages Button - Hide when chat is open */}
      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <button
            onClick={handleToggleChat}
            className="relative flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
            aria-label="Mở trò chuyện"
          >
            {/* Chat Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>

            {/* Text */}
            <span className="text-white font-medium text-sm group-hover:text-gray-100 transition-colors">
              Tin nhắn
            </span>

            {/* Avatar */}
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-700 overflow-hidden flex-shrink-0">
              {decodedUser?.avatarUrl ? (
                <Image
                  src={decodedUser.avatarUrl}
                  alt={decodedUser.fullName || "User"}
                  width={32}
                  height={32}
                  className="rounded-full"
                  style={{ objectFit: 'cover' }}
                  priority={false}
                />
              ) : (
                <span className="text-white text-sm font-semibold">
                  {getUserInitial(decodedUser)}
                </span>
              )}
            </div>

            {/* Badge - Show unread message count */}
            {displayBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center border-2 border-gray-800 animate-pulse">
                {displayBadgeCount > 99 ? "99+" : displayBadgeCount > 9 ? "9+" : displayBadgeCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Popup */}
      <ChatBox 
        isOpen={isChatOpen} 
        onClose={handleCloseChat} 
        initialConversations={initialConversations} 
      />
    </>
  );
};

export default ChatFloatingButton;

// Export as ChatButton for backward compatibility
export { ChatFloatingButton as ChatButton };
