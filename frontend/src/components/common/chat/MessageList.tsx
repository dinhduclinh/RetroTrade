"use client";

import React, { useEffect, useRef } from "react";
import { Message } from "@/services/messages/messages.api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom when messages change
    const scrollToBottom = () => {
      if (containerRef.current) {
        const scrollHeight = containerRef.current.scrollHeight;
        const clientHeight = containerRef.current.clientHeight;
        containerRef.current.scrollTop = scrollHeight - clientHeight;
      }
    };

    // Small delay to ensure DOM is updated
    setTimeout(scrollToBottom, 0);
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return format(date, "HH:mm");
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hôm qua ${format(date, "HH:mm")}`;
    } else {
      return format(date, "dd/MM/yyyy HH:mm", { locale: vi });
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <div>Chưa có tin nhắn nào</div>
          <div className="text-sm">Bắt đầu cuộc trò chuyện!</div>
        </div>
      ) : (
        messages.map((message, index) => {
          const isOwnMessage = message.fromUserId._id === currentUserId || String(message.fromUserId._id) === String(currentUserId);

          return (
            <div
              key={message._id}
              className={`flex flex-col gap-1 ${isOwnMessage ? "items-end" : "items-start"}`}
            >
              {/* Message content */}
              <div
                className={`max-w-[75%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed ${
                  isOwnMessage
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-900 shadow-sm"
                }`}
              >
                {message.content}
              </div>
              {/* Timestamp */}
              <span className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</span>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MessageList;

