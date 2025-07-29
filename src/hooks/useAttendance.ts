
import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { apiGateway } from '@/utils/apiGateway';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  class_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by: string | null;
  marked_at: string;
  session_id: string | null;
  location_verified: boolean;
  device_info: Record<string, any>;
}

export interface AttendanceSession {
  id: string;
  course_id: string;
  instructor_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  topic: string | null;
  session_type: string;
  room_location: string | null;
  qr_code: string | null;
  is_active: boolean;
  created_at: string;
}

export const useAttendance = () => {
  const { profile } = useUserProfile();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAttendanceData = async () => {
      if (!profile?.id) {
        if (mounted) {
          setAttendanceRecords([]);
          setSessions([]);
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        
        if (profile.user_type === 'student') {
          const response = await apiGateway.select('attendance', {
            filters: { student_id: profile.id },
            order: { column: 'class_date', ascending: false }
          });

          if (!mounted) return;

          if (response.success && response.data) {
            setAttendanceRecords(response.data as AttendanceRecord[]);
          } else {
            setError(response.error || 'Failed to fetch attendance');
            setAttendanceRecords([]);
          }
        } else if (profile.user_type === 'faculty') {
          const [attendanceResponse, sessionsResponse] = await Promise.all([
            apiGateway.select('attendance', {
              filters: { marked_by: profile.id },
              order: { column: 'class_date', ascending: false }
            }),
            apiGateway.select('attendance_sessions', {
              filters: { instructor_id: profile.id },
              order: { column: 'session_date', ascending: false }
            })
          ]);

          if (!mounted) return;

          if (attendanceResponse.success && attendanceResponse.data) {
            setAttendanceRecords(attendanceResponse.data as AttendanceRecord[]);
          }

          if (sessionsResponse.success && sessionsResponse.data) {
            setSessions(sessionsResponse.data as AttendanceSession[]);
          }
        }
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        if (mounted) {
          setError('Failed to fetch attendance data');
          setAttendanceRecords([]);
          setSessions([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAttendanceData();

    return () => {
      mounted = false;
    };
  }, [profile]);

  const getAttendanceStatistics = (courseId?: string) => {
    let filteredRecords = attendanceRecords;
    
    if (courseId) {
      filteredRecords = attendanceRecords.filter(r => r.course_id === courseId);
    }

    const totalClasses = filteredRecords.length;
    const presentCount = filteredRecords.filter(r => r.status === 'present').length;
    const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
    const lateCount = filteredRecords.filter(r => r.status === 'late').length;
    const excusedCount = filteredRecords.filter(r => r.status === 'excused').length;

    const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

    return {
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendancePercentage
    };
  };

  return {
    attendanceRecords,
    sessions,
    loading,
    error,
    getAttendanceStatistics,
    refetch: () => {
      setLoading(true);
      // This will trigger the useEffect to refetch
    }
  };
};
