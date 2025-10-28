import React, { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "@/store/redux_store";
import ChatBox from "./chat/ChatBox";
import { jwtDecode } from "jwt-decode";

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
  const router = useRouter();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  // Don't show button if user not logged in
  if (!decodedUser) {
    return null;
  }

  return (
    <>
      {/* Floating Messages Button - Hide when chat is open */}
      {!isChatOpen && (
        <button
          onClick={handleToggleChat}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
        >
        {/* Chat Icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>

        {/* Text "Messages" */}
        <span className="text-white font-medium text-sm group-hover:text-gray-100 transition-colors">
          Messages
        </span>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-700">
          {decodedUser?.avatarUrl ? (
            <img 
              src={decodedUser.avatarUrl} 
              alt={decodedUser.fullName || "User"} 
              className="w-full h-full rounded-full object-cover"
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
      )}

      {/* Chat Popup */}
      <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default ChatFloatingButton;

// Export as ChatButton for backward compatibility
export { ChatFloatingButton as ChatButton };
