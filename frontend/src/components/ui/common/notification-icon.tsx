"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Bell, CheckCircle, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/common/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/common/dropdown-menu';
import { notificationApi, Notification } from "@/services/auth/notification.api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NotificationIconProps {
  className?: string;
}

// Constants
const POLLING_INTERVAL = 30000; // 30 seconds
const NOTIFICATIONS_LIMIT = 20;

export function NotificationIcon({ className }: NotificationIconProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized: Calculate unread count from notifications
  const computedUnreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
      // Don't show toast for background polling errors
    }
  }, []);

  const fetchNotifications = useCallback(async (updateUnreadCount = false) => {
    try {
      setIsLoading(true);
      const data = await notificationApi.getNotifications({ 
        limit: NOTIFICATIONS_LIMIT, 
        skip: 0 
      });
      
      if (data?.items) {
        setNotifications(data.items);
        // Update unread count from notifications if requested
        if (updateUnreadCount) {
          const count = data.items.filter(n => !n.isRead).length;
          setUnreadCount(count);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Không thể tải thông báo");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and polling setup
  useEffect(() => {
    // Fetch initial data
    fetchUnreadCount();
    fetchNotifications(true); // Update unread count on initial load

    // Set up polling every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(false); // Don't update unread count (it's already being polled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen

  const handleMarkAsRead = useCallback(async (id: string, event?: React.MouseEvent) => {
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
  }, []);

  const handleMarkAllAsRead = useCallback(async (event: React.MouseEvent) => {
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
  }, []);

  // Memoized date formatter
  const formatDate = useCallback((dateString: string) => {
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
  }, []);

  // Memoized notification icon getter
  const getNotificationIcon = useCallback((type: string) => {
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
  }, []);

  // Use the larger of API unread count or computed unread count
  const displayUnreadCount = useMemo(() => {
    return Math.max(unreadCount, computedUnreadCount);
  }, [unreadCount, computedUnreadCount]);

  const handleNotificationClick = useCallback((notification: Notification, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification._id, event);
    }
    
    // Navigate to detail page
    router.push(`/auth/notifications/${notification._id}`);
    setIsOpen(false);
  }, [router, handleMarkAsRead]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
        >
          <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          {displayUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[22px] h-5 px-1.5 flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg animate-pulse">
              {displayUnreadCount > 99 ? '99+' : displayUnreadCount > 9 ? '9+' : displayUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-96 max-h-[600px] overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xl rounded-xl z-[200]" 
        align="end"
        sideOffset={12}
        alignOffset={0}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Thông báo</h3>
              {displayUnreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {displayUnreadCount} mới
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 hover:bg-white/50 dark:hover:bg-gray-700"
              onClick={() => {
                router.push('/auth/notifications');
                setIsOpen(false);
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Xem tất cả
            </Button>
          </div>
          
          {displayUnreadCount > 0 && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                Đánh dấu tất cả đã đọc
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[480px]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Không có thông báo nào
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thông báo mới sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`group relative p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    !notification.isRead 
                      ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-l-4 border-blue-500' 
                      : 'hover:border-l-4 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                  onClick={(e) => handleNotificationClick(notification, e)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      !notification.isRead
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {getNotificationIcon(notification.notificationType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-semibold line-clamp-1 ${
                          !notification.isRead 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5 animate-pulse"></span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                        {notification.body}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDate(notification.CreatedAt)}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                            {notification.notificationType}
                          </span>
                        </div>
                        
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-100 dark:hover:bg-green-900/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id, e);
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

