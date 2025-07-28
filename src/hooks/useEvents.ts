
import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { apiGateway } from '@/utils/apiGateway';

export interface Event {
  id: string;
  event_name: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  event_type: string | null;
  max_participants: number | null;
  registration_required: boolean;
  is_active: boolean;
  organizer_id: string | null;
  college_id: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  status: 'registered' | 'cancelled' | 'attended';
  additional_info: Record<string, any>;
}

export const useEvents = () => {
  const { profile } = useUserProfile();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.college_id) {
      fetchEvents();
      fetchRegistrations();
    }
  }, [profile?.college_id]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const response = await apiGateway.select('events', {
        filters: { 
          college_id: profile?.college_id,
          is_active: true
        },
        order: { column: 'start_date', ascending: true }
      });

      if (response.success && response.data) {
        setEvents(response.data as Event[]);
      } else {
        setError(response.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!profile?.id) return;

    try {
      const response = await apiGateway.select('event_registrations', {
        filters: { user_id: profile.id },
        order: { column: 'registration_date', ascending: false }
      });

      if (response.success && response.data) {
        setRegistrations(response.data as EventRegistration[]);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    }
  };

  const registerForEvent = async (eventId: string, additionalInfo?: Record<string, any>) => {
    if (!profile?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const response = await apiGateway.insert('event_registrations', {
        event_id: eventId,
        user_id: profile.id,
        status: 'registered',
        additional_info: additionalInfo || {}
      });

      if (response.success) {
        await fetchRegistrations();
        return { success: true, data: response.data };
      }

      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to register for event' };
    }
  };

  const cancelRegistration = async (registrationId: string) => {
    try {
      const response = await apiGateway.update('event_registrations', 
        { status: 'cancelled' },
        { id: registrationId }
      );

      if (response.success) {
        await fetchRegistrations();
        return { success: true, data: response.data };
      }

      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to cancel registration' };
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await apiGateway.insert('events', eventData);

      if (response.success) {
        await fetchEvents();
        return { success: true, data: response.data };
      }

      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to create event' };
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
      const response = await apiGateway.update('events', updates, { id: eventId });

      if (response.success) {
        await fetchEvents();
        return { success: true, data: response.data };
      }

      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to update event' };
    }
  };

  const getEventStatistics = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    const eventRegistrations = registrations.filter(r => r.event_id === eventId);
    
    return {
      totalRegistrations: eventRegistrations.length,
      activeRegistrations: eventRegistrations.filter(r => r.status === 'registered').length,
      cancelledRegistrations: eventRegistrations.filter(r => r.status === 'cancelled').length,
      attendedCount: eventRegistrations.filter(r => r.status === 'attended').length,
      maxParticipants: event?.max_participants || 0,
      availableSlots: event?.max_participants ? event.max_participants - eventRegistrations.filter(r => r.status === 'registered').length : null
    };
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => new Date(event.start_date) > now);
  };

  const getPastEvents = () => {
    const now = new Date();
    return events.filter(event => new Date(event.end_date) < now);
  };

  const getUserRegistrations = () => {
    return registrations.filter(r => r.status === 'registered');
  };

  return {
    events,
    registrations,
    loading,
    error,
    registerForEvent,
    cancelRegistration,
    createEvent,
    updateEvent,
    getEventStatistics,
    getUpcomingEvents,
    getPastEvents,
    getUserRegistrations,
    refetch: fetchEvents
  };
};
