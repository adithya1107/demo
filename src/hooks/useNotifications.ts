
import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { apiGateway } from '@/utils/apiGateway';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  college_id: string;
  title: string;
  content: string;
  notification_type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  action_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  expires_at: string | null;
}

export const useNotifications = () => {
  const { profile } = useUserProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [profile?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiGateway.select('notifications', {
        filters: { recipient_id: profile?.id },
        order: { column: 'created_at', ascending: false },
        limit: 50
      });

      if (response.success && response.data) {
        const notificationData = response.data as Notification[];
        setNotifications(notificationData);
        setUnreadCount(notificationData.filter(n => !n.is_read).length);
      } else {
        setError(response.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          if (updatedNotification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiGateway.update('notifications', 
        { is_read: true }, 
        { id: notificationId }
      );

      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await apiGateway.update('notifications', 
          { is_read: true }, 
          { id: notification.id }
        );
      }

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      const response = await apiGateway.insert('notifications', notification);
      return response.success;
    } catch (err) {
      console.error('Failed to create notification:', err);
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: fetchNotifications
  };
};
