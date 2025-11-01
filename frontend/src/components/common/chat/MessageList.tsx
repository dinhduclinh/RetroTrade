"use client";

import React, { useEffect, useLayoutEffect, useRef, useMemo, useState } from "react";
import { Message } from "@/services/messages/messages.api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import ImageModal from "./ImageModal";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  otherUserId?: string; // ID of the other user in conversation (for read receipt)
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: string) => void;
  editingMessageId?: string | null;
  editingContent?: string;
  onEditingContentChange?: (content: string) => void;
  onConfirmEdit?: () => void;
  onCancelEdit?: () => void;
  menuMessageId?: string | null;
  onMenuToggle?: (messageId: string | null) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  currentUserId,
  otherUserId,
  onEditMessage,
  onDeleteMessage,
  editingMessageId,
  editingContent,
  onEditingContentChange,
  onConfirmEdit,
  onCancelEdit,
  menuMessageId,
  onMenuToggle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Sort messages by createdAt (oldest first, newest last) to ensure correct order
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return aDate - bDate; // Ascending: oldest first
    });
  }, [messages]);

  // Use useLayoutEffect to scroll immediately after DOM update
  useLayoutEffect(() => {
    if (sortedMessages.length > 0 && containerRef.current) {
      // Force scroll immediately after DOM update
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [sortedMessages]);

  useEffect(() => {
    prevMessagesLengthRef.current = sortedMessages.length;

    // Always scroll to bottom on initial load or when new message arrives
    if (sortedMessages.length > 0) {
      // Force scroll to bottom function
      const scrollToBottom = () => {
        if (containerRef.current) {
          // Multiple methods to ensure scroll works
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
          
          // Also try scrollIntoView if we have last message element
          if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
          }
        }
      };

      // Try multiple times to ensure scroll works
      const timeout1 = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 0);
      
      const timeout2 = setTimeout(scrollToBottom, 100);
      
      const timeout3 = setTimeout(() => {
        if (lastMessageRef.current) {
          lastMessageRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }, 150);
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
    }
  }, [sortedMessages]);

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
      {sortedMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <div>Chưa có tin nhắn nào</div>
          <div className="text-sm">Bắt đầu cuộc trò chuyện!</div>
        </div>
      ) : (
        sortedMessages.map((message, index) => {
          const isOwnMessage = message.fromUserId._id === currentUserId || String(message.fromUserId._id) === String(currentUserId);
          const isLastMessage = index === sortedMessages.length - 1;

          return (
            <div
              key={message._id}
              ref={isLastMessage ? lastMessageRef : null}
              className={`flex flex-col gap-1 ${isOwnMessage ? "items-end" : "items-start"}`}
            >
              {/* Check if message is image-only (no real text content) */}
              {message.mediaType === 'image' && message.mediaUrl && 
               (!message.content || message.content === '📷 Hình ảnh' || message.content.trim() === '') &&
               editingMessageId !== message._id ? (
                // Image only - no bubble, just the image
                <div className={`flex items-end ${isOwnMessage ? "flex-row-reverse gap-0 ml-auto" : "flex-row gap-2"}`}>
                  <div className="relative max-w-[75%] rounded-lg overflow-hidden">
                    <Image
                      src={message.mediaUrl}
                      alt="Hình ảnh"
                      width={400}
                      height={400}
                      className="object-cover cursor-pointer rounded-lg"
                      onClick={() => setSelectedImageUrl(message.mediaUrl!)}
                    />
                  </div>
                  
                  {/* Kebab menu for own messages - image only */}
                  {isOwnMessage && 
                   !message.isDeleted && 
                   message.content !== '[Tin nhắn đã được thu hồi]' &&
                   onEditMessage &&
                   onDeleteMessage && (
                    <div className="relative flex items-center self-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuToggle?.(menuMessageId === message._id ? null : message._id);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-base px-1 py-1 rounded hover:bg-gray-100 transition-colors"
                        title="Tùy chọn"
                      >
                        ⋮
                      </button>
                      {menuMessageId === message._id && (
                        <div 
                          className="absolute right-full mr-1 top-0 bg-white text-gray-800 text-xs rounded shadow-lg border border-gray-200 z-10 min-w-[120px]"
                          onMouseLeave={() => onMenuToggle?.(null)}
                        >
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onMenuToggle?.(null);
                              onDeleteMessage(message._id);
                            }}
                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500 rounded"
                          >
                            Thu hồi
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Message with bubble (has text or video)
                <div className={`flex items-end ${isOwnMessage ? "flex-row-reverse gap-0 ml-auto" : "flex-row gap-2"}`}>
                  <div
                    className={`max-w-[75%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed ${
                      isOwnMessage
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-900 shadow-sm"
                    }`}
                  >
                    {editingMessageId === message._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editingContent || ""}
                          onChange={(e) => onEditingContentChange?.(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { 
                              e.preventDefault(); 
                              onConfirmEdit?.(); 
                            }
                            if (e.key === 'Escape') onCancelEdit?.();
                          }}
                          className="flex-1 bg-white/10 rounded px-2 py-1 text-sm text-white placeholder-white/70 focus:outline-none"
                          placeholder="Sửa tin nhắn..."
                          autoFocus
                        />
                        <button 
                          onClick={onConfirmEdit} 
                          className="text-xs underline text-white/80 hover:text-white"
                        >
                          Lưu
                        </button>
                        <button 
                          onClick={onCancelEdit} 
                          className="text-xs underline text-white/80 hover:text-white"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Media (image with text, or video) */}
                        {message.mediaType && message.mediaUrl && (
                          <div className="mb-2">
                            {message.mediaType === 'image' ? (
                              <div className="relative max-w-full rounded-lg overflow-hidden">
                                <Image
                                  src={message.mediaUrl}
                                  alt={message.content || "Hình ảnh"}
                                  width={400}
                                  height={400}
                                  className="object-cover cursor-pointer rounded-lg"
                                  onClick={() => setSelectedImageUrl(message.mediaUrl!)}
                                />
                              </div>
                            ) : message.mediaType === 'video' ? (
                              <div className="relative max-w-full rounded-lg overflow-hidden">
                                <video
                                  src={message.mediaUrl}
                                  controls
                                  className="max-w-full max-h-96 rounded-lg"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            ) : null}
                          </div>
                        )}
                        {/* Text content - hide defaults for image/video placeholders */}
                        {message.content && 
                         !(
                           (message.mediaType === 'image' && (message.content === '📷 Hình ảnh' || message.content.trim() === '')) ||
                           (message.mediaType === 'video' && (message.content === '🎥 Video' || message.content.trim() === ''))
                         ) && (
                          <div className={message.isDeleted || message.content === '[Tin nhắn đã được thu hồi]' ? 'italic opacity-70' : ''} style={{ whiteSpace: 'pre-wrap' }}>
                            {message.content}
                            {message.editedAt && !message.isDeleted && message.content !== '[Tin nhắn đã được thu hồi]' && (
                              <span className="ml-2 text-[10px] opacity-75">(đã sửa)</span>
                            )}
                            {/* Read receipt for own messages */}
                            {isOwnMessage && 
                             !message.isDeleted && 
                             message.content !== '[Tin nhắn đã được thu hồi]' &&
                             otherUserId && 
                             message.readBy && 
                             message.readBy.includes(otherUserId) && (
                              <span className="ml-2 text-blue-500 text-xs" title="Đã đọc">✓</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Kebab menu for own messages */}
                  {isOwnMessage && 
                   !message.isDeleted && 
                   message.content !== '[Tin nhắn đã được thu hồi]' &&
                   editingMessageId !== message._id &&
                   onEditMessage &&
                   onDeleteMessage && (
                    <div className="relative flex items-center self-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMenuToggle?.(menuMessageId === message._id ? null : message._id);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-base px-1 py-1 rounded hover:bg-gray-100 transition-colors"
                        title="Tùy chọn"
                      >
                        ⋮
                      </button>
                      {menuMessageId === message._id && (
                        <div 
                          className="absolute right-full mr-1 top-0 bg-white text-gray-800 text-xs rounded shadow-lg border border-gray-200 z-10 min-w-[120px]"
                          onMouseLeave={() => onMenuToggle?.(null)}
                        >
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onMenuToggle?.(null);
                              onEditMessage(message);
                            }}
                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded-t"
                          >
                            Sửa
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onMenuToggle?.(null);
                              onDeleteMessage(message._id);
                            }}
                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500 rounded-b"
                          >
                            Thu hồi
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Timestamp */}
              <span className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</span>
            </div>
          );
        })
      )}
      
      {/* Image Modal */}
      <ImageModal
        imageUrl={selectedImageUrl || ""}
        isOpen={!!selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
      />
    </div>
  );
};

export default MessageList;

