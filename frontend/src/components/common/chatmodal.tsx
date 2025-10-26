import React, { useState, useEffect } from "react";
import { getMessages, sendMessage } from "@/services/messages/messages.api";

// Danh sách liên hệ cứng mẫu, có thể lấy từ props/router/api
const contactsDefault = [
  { _id: "adminId", name: "Admin", role: "admin", avatar: "🛡️", lastMessage: "How can I help you?" },
  { _id: "modId", name: "Moderator", role: "moderator", avatar: "👩‍💼", lastMessage: "Chuyên viên tư vấn" },
  // Có thể thêm renter/owner ở đây khi cần
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<Props> = ({ open, onClose }) => {
  const [contacts] = useState(contactsDefault);
  const [selectedContact, setSelectedContact] = useState(contactsDefault[0]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!open || !selectedContact) return;
    let interval: NodeJS.Timeout;
    const fetchMsg = async () => {
      const res = await getMessages(selectedContact._id);
      const data = await res.json();
      setMessages(data);
    };
    fetchMsg();
    interval = setInterval(fetchMsg, 4000);
    return () => clearInterval(interval);
  }, [selectedContact, open]);

  const handleSend = async () => {
    if (!input.trim() || !selectedContact) return;
    await sendMessage({ conversationId: selectedContact._id, content: input });
    setInput("");
    const res = await getMessages(selectedContact._id);
    const data = await res.json();
    setMessages(data);
  };

  if (!open) return null;
  return (
    <div style={{
      position: "fixed", right: 32, bottom: 32,
      width: 520, height: 500, background: "#fff",
      borderRadius: 12, boxShadow: "0 4px 32px #0006",
      zIndex: 10001, display: "flex"
    }}>
      <div style={{ minWidth: 170, background: "#f2f5f7", borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16, padding: "12px 15px", borderBottom: "1px solid #e6e6e6" }}>
          Chats
        </div>
        {contacts.map((c) => (
          <div
            key={c._id}
            onClick={() => setSelectedContact(c)}
            style={{
              background: selectedContact._id === c._id ? "#e8faff" : "#f2f5f7",
              padding: 12,
              borderBottom: "1px solid #f0f0f0",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10
            }}>
            <span style={{ fontSize: 22 }}>{c.avatar || "👤"}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{c.name} <span style={{
                color: "#777", fontSize: 12, fontWeight: 400
              }}>({c.role})</span></div>
              <div style={{ fontSize: 12, color: "#8b8b8b" }}>{c.lastMessage}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#eef3f6" }}>
        <div style={{
          padding: "10px 18px", fontWeight: 600, color: "#2b2b2b", borderBottom: "1px solid #ebebeb",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <span>{selectedContact?.name || "--"}</span>
          <button onClick={onClose} style={{
            border: "none", background: "none", fontSize: 20, color: "#aaa", cursor: "pointer"
          }}>&times;</button>
        </div>
        <div style={{ flex: 1, padding: "15px 18px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {messages.map((msg) => (
            <div
              key={msg._id}
              style={{
                alignSelf: msg.fromUserId === "CURRENT_USER_ID" ? "flex-end" : "flex-start",
                background: msg.fromUserId === "CURRENT_USER_ID" ? "#b8e1fc" : "#fff",
                margin: "6px 0", padding: "8px 14px", borderRadius: 8, maxWidth: "66%"
              }}>
              <span>{msg.content}</span>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          borderTop: "1px solid #dde", padding: "10px 16px 14px 12px", display: "flex", gap: 10, background: "#fff"
        }}>
          <input
            style={{ flex: 1, border: "1px solid #ddd", borderRadius: 20, padding: "7px 15px" }}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Nhập tin nhắn của bạn..."
          />
          <button onClick={handleSend}
            style={{
              padding: "0 18px", borderRadius: 20, background: "#009afc", color: "#fff", border: "none",
              fontWeight: 600, fontSize: 15
            }}>➤</button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
