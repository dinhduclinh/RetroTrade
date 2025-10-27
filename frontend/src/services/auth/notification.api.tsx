import api from '../customizeAPI';

export interface Notification {
  _id: string;
  user: string;
  notificationType: string;
  title: string;
  body: string;
  metaData?: string;
  isRead: boolean;
  CreatedAt: string;
}

export interface NotificationResponse {
  items: Notification[];
  totalItems: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export const notificationApi = {
  // Get all notifications with pagination
  getNotifications: async (params?: { limit?: number; skip?: number; isRead?: boolean }): Promise<NotificationResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());

    const response = await api.get(`/notifications?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    
    const data = await response.json();
    return data.data;
  },

  // Get unread notification count (for badge)
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    if (!response.ok) throw new Error('Failed to fetch unread count');
    
    const data = await response.json();
    return data.data.unreadCount;
  },

  // Mark a notification as read
  markAsRead: async (id: string): Promise<void> => {
    const response = await api.put(`/notifications/${id}/read`, {});
    if (!response.ok) throw new Error('Failed to mark notification as read');
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    const response = await api.put('/notifications/read-all', {});
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
  },

  // Delete a notification
  deleteNotification: async (id: string): Promise<void> => {
    const response = await api.delete(`/notifications/${id}`);
    if (!response.ok) throw new Error('Failed to delete notification');
  },

  // Delete all read notifications
  deleteAllReadNotifications: async (): Promise<void> => {
    const response = await api.delete('/notifications/read/all');
    if (!response.ok) throw new Error('Failed to delete read notifications');
  },
};

