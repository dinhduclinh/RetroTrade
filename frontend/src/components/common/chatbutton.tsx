"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";
import ChatBox from "./chat/ChatBox";
import { Conversation, getConversations } from "@/services/messages/messages.api";

interface DecodedToken {
  email: string;
  userGuid?: string;
  avatarUrl?: string;
  fullName?: string;
  _id?: string;
  exp: number;
  iat: number;
}

type ChatButtonProps = {
  badgeCount?: number;
};

const ChatFloatingButton: React.FC<ChatButtonProps> = ({ badgeCount = 0 }) => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialConversations, setInitialConversations] = useState<Conversation[]>([]);

  // Decode user from token
  const decodedUser = useMemo(() => {
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

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Prefetch recent conversations so history is ready when opening the chat
  useEffect(() => {
    let mounted = true;
    const loadRecent = async () => {
      if (!decodedUser) return;
      try {
        const res = await getConversations();
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setInitialConversations(data.data || []);
        }
      } catch {
        // ignore
      }
    };
    loadRecent();
    return () => {
      mounted = false;
    };
  }, [decodedUser]);

  // Don't show button if user not logged in
  if (!decodedUser) {
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
                />
              ) : (
                <span className="text-white text-sm font-semibold">
                  {decodedUser?.fullName?.charAt(0).toUpperCase() || decodedUser?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>

            {/* Badge */}
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-gray-800">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Popup */}
      <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} initialConversations={initialConversations} />
    </>
  );
};

export default ChatFloatingButton;

// Export as ChatButton for backward compatibility
export { ChatFloatingButton as ChatButton };
