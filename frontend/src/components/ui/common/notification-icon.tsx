"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bell, CheckCircle, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/common/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/common/dropdown-menu';
import { notificationApi, Notification } from "@/services/auth/notification.api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NotificationIconProps {
  className?: string;
}

export function NotificationIcon({ className }: NotificationIconProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await notificationApi.getNotifications({ limit: 20, skip: 0 });
      setNotifications(data.items);
      setUnreadCount(data.items.filter(n => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Không thể tải thông báo");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch initial data
    fetchUnreadCount();
    fetchNotifications();

    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchNotifications]);

  useEffect(() => {
    // Fetch notifications when dropdown opens
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success("Đã đánh dấu đã đọc");
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Không thể đánh dấu đã đọc");
    }
  };

  const handleMarkAllAsRead = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("Đã đánh dấu tất cả đã đọc");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Không thể đánh dấu tất cả đã đọc");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "Login Success":
      case "Registration Success":
      case "Email Verified":
        return "✅";
      case "Product Approved":
        return "✨";
      case "Product Rejected":
        return "⚠️";
      case "Order Placed":
      case "Order Confirmed":
        return "📦";
      case "Payment Received":
        return "💰";
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base">Thông báo</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                router.push('/auth/notifications');
                setIsOpen(false);
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Xem tất cả
            </Button>
          </div>
          
          {unreadCount > 0 && (
            <>
              <div className="flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Đánh dấu tất cả đã đọc
                </Button>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Đang tải...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Không có thông báo nào
          </div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              >
                <div className="flex items-start gap-2">
                  <div className="text-xl">
                    {getNotificationIcon(notification.notificationType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notification.isRead ? 'font-bold' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(notification.CreatedAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleMarkAsRead(notification._id, e)}
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

