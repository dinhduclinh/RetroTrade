"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/redux_store';
import { Bell, CheckCircle, CheckCheck, ArrowLeft, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/common/button';
import { Card, CardContent } from '@/components/ui/common/card';
import { Badge } from '@/components/ui/common/badge';
import { toast } from 'sonner';
import { notificationApi, type Notification } from '@/services/auth/notification.api';

export default function NotificationsPage() {
  const router = useRouter();
  const { accessToken } = useSelector((state: RootState) => state.auth);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!accessToken) {
      router.push('/auth/login');
    }
  }, [accessToken, router]);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await notificationApi.getNotifications({ limit: 100, skip: 0 });
      setNotifications(data.items || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Không thể tải thông báo');
      toast.error('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Fetch notifications khi component mount
  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
    }
  }, [accessToken, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  };

  const getNotificationIcon = (notificationType: string, isWhite = false) => {
    const iconClass = "w-6 h-6";
    
    if (isWhite) {
      switch (notificationType) {
        case 'Identity Verified':
        case 'Login Success':
        case 'Registration Success':
        case 'Email Verified':
        case 'Order Placed':
        case 'Order Confirmed':
        case 'Payment Received':
        case 'Product Approved':
          return <CheckCircle className={`${iconClass} text-white`} />;
        case 'Profile Updated':
        case 'Avatar Updated':
          return <CheckCircle2 className={`${iconClass} text-white`} />;
        case 'Password Changed':
          return <AlertCircle className={`${iconClass} text-white`} />;
        case 'Product Rejected':
          return <AlertCircle className={`${iconClass} text-white`} />;
        default:
          return <Info className={`${iconClass} text-white`} />;
      }
    }
    
    switch (notificationType) {
      case 'Identity Verified':
      case 'Login Success':
      case 'Registration Success':
      case 'Email Verified':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'Profile Updated':
      case 'Avatar Updated':
        return <CheckCircle2 className={`${iconClass} text-blue-500`} />;
      case 'Password Changed':
        return <AlertCircle className={`${iconClass} text-orange-500`} />;
      case 'Order Placed':
      case 'Order Confirmed':
      case 'Payment Received':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'Product Approved':
        return <CheckCircle className={`${iconClass} text-emerald-500`} />;
      case 'Product Rejected':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getNotificationColor = (notificationType: string) => {
    switch (notificationType) {
      case 'Identity Verified':
      case 'Login Success':
      case 'Registration Success':
      case 'Email Verified':
      case 'Product Approved':
      case 'Payment Received':
        return 'from-green-500 to-emerald-600';
      case 'Profile Updated':
      case 'Avatar Updated':
      case 'Order Placed':
      case 'Order Confirmed':
        return 'from-blue-500 to-indigo-600';
      case 'Password Changed':
        return 'from-orange-500 to-amber-600';
      case 'Product Rejected':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          {/* Header Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Thông báo</h1>
                    <p className="text-white/90 text-sm sm:text-base">
                      {notifications.length} thông báo 
                      {unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          {unreadCount} chưa đọc
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <Button
                    onClick={handleMarkAllAsRead}
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all hover:scale-105"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Đánh dấu tất cả đã đọc
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="py-20">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-gray-600 text-lg font-medium">Đang tải thông báo...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-0 shadow-xl bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-20">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">{error}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Vui lòng thử lại sau</p>
                <Button 
                  onClick={fetchNotifications} 
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="py-20">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                  <Bell className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                </div>
                <p className="text-gray-900 dark:text-white text-xl font-bold mb-2">Chưa có thông báo nào</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Thông báo mới sẽ hiển thị ở đây</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification._id}
                className={`group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-0 overflow-hidden ${
                  !notification.isRead 
                    ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-blue-950/20 shadow-lg border-l-4 border-blue-500' 
                    : 'bg-white dark:bg-gray-900 shadow-md hover:shadow-lg'
                }`}
                onClick={() => {
                  router.push(`/auth/notifications/${notification._id}`);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    {/* Icon with background */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                      !notification.isRead
                        ? `bg-gradient-to-br ${getNotificationColor(notification.notificationType)}`
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
                    }`}>
                      {getNotificationIcon(notification.notificationType, !notification.isRead)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className={`text-base sm:text-lg font-bold line-clamp-2 ${
                          !notification.isRead 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge 
                            variant="default" 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md flex-shrink-0 animate-pulse"
                          >
                            Mới
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-4 line-clamp-2 leading-relaxed">
                        {notification.body}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                            <span>{formatDate(notification.CreatedAt)}</span>
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs px-3 py-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          >
                            {notification.notificationType}
                          </Badge>
                        </div>

                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                            className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Đánh dấu đã đọc
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${getNotificationColor(notification.notificationType)} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

