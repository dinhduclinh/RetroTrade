"use client";

import { useState, useEffect, useCallback } from 'react';
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

  const getNotificationIcon = (notificationType: string) => {
    switch (notificationType) {
      case 'Identity Verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Profile Updated':
      case 'Avatar Updated':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      case 'Password Changed':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'Order Placed':
      case 'Payment Received':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
                <p className="text-sm text-gray-600">
                  {notifications.length} thông báo {unreadCount > 0 && `• ${unreadCount} chưa đọc`}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Đang tải thông báo...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-gray-900 mb-4">{error}</p>
                <Button onClick={fetchNotifications} variant="outline">
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <Bell className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg mb-2">Chưa có thông báo nào</p>
                <p className="text-gray-500 text-sm">Thông báo mới sẽ hiển thị ở đây</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead ? 'bg-blue-50 border-blue-200 border-l-4' : ''
                }`}
              >
                <CardContent className="p-4" onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notificationType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge variant="default" className="bg-blue-500 text-white">
                            Mới
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.body}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.CreatedAt)}
                          </span>
                          <Badge variant="outline" className="text-xs">
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
                            className="h-7 text-xs"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Đánh dấu đã đọc
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

