import React from "react";
import { MdOutlineChat } from "react-icons/md";
import { useRouter } from "next/router";

type ChatButtonProps = {
  badgeCount?: number;
};

const ChatButton: React.FC<ChatButtonProps> = ({ badgeCount = 1 }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/messages"); // Điều hướng đến page messages
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(90deg, #0060df, #00ccff)",
        borderRadius: "12px",
        boxShadow: "0 2px 10px #0003",
        padding: "8px 18px 8px 14px",
        cursor: "pointer",
        color: "#fff",
        fontWeight: 500,
        fontSize: 18,
        userSelect: "none",
      }}
      onClick={handleClick}
    >
      <div style={{ position: "relative" }}>
        <MdOutlineChat size={28} />
        {badgeCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              background: "#ff4b5c",
              borderRadius: "50%",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "0.92em",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
              boxSizing: "border-box",
            }}
          >
            {badgeCount}
          </span>
        )}
      </div>
      <span style={{ marginLeft: 10 }}>Chat</span>
    </div>
  );
};

export default ChatButton;
