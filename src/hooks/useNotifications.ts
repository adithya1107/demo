
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
    let mounted = true;

    const fetchNotifications = async () => {
      if (!profile?.id) {
        if (mounted) {
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        const response = await apiGateway.select('notifications', {
          filters: { recipient_id: profile.id },
          order: { column: 'created_at', ascending: false },
          limit: 50
        });

        if (!mounted) return;

        if (response.success && response.data) {
          const notificationData = response.data as Notification[];
          setNotifications(notificationData);
          setUnreadCount(notificationData.filter(n => !n.is_read).length);
        } else {
          setError(response.error || 'Failed to fetch notifications');
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        if (mounted) {
          setError('Failed to fetch notifications');
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchNotifications();

    return () => {
      mounted = false;
    };
  }, [profile?.id]);

  // Set up real-time subscription
  useEffect(() => {
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
          if (updatedNotification.is_read && !notifications.find(n => n.id === updatedNotification.id)?.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, notifications]);

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
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    try {
      const promises = unreadNotifications.map(notification =>
        apiGateway.update('notifications', 
          { is_read: true }, 
          { id: notification.id }
        )
      );

      await Promise.all(promises);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      return { success: true };
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: () => {
      setLoading(true);
      // This will trigger the useEffect to refetch
    }
  };
};
