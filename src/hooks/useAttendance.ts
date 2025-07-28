
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
    if (profile?.id) {
      fetchAttendanceData();
    }
  }, [profile?.id]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      if (profile?.user_type === 'student') {
        const response = await apiGateway.select('attendance', {
          filters: { student_id: profile.id },
          order: { column: 'class_date', ascending: false }
        });

        if (response.success && response.data) {
          setAttendanceRecords(response.data as AttendanceRecord[]);
        }
      } else if (profile?.user_type === 'faculty') {
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

        if (attendanceResponse.success && attendanceResponse.data) {
          setAttendanceRecords(attendanceResponse.data as AttendanceRecord[]);
        }

        if (sessionsResponse.success && sessionsResponse.data) {
          setSessions(sessionsResponse.data as AttendanceSession[]);
        }
      }
    } catch (err) {
      setError('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (sessionId: string, studentId: string, status: AttendanceRecord['status']) => {
    try {
      const response = await apiGateway.insert('attendance', {
        student_id: studentId,
        course_id: sessions.find(s => s.id === sessionId)?.course_id || '',
        class_date: new Date().toISOString().split('T')[0],
        status,
        marked_by: profile?.id || '',
        session_id: sessionId,
        location_verified: true,
        device_info: {
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });

      if (response.success) {
        await fetchAttendanceData();
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to mark attendance' };
    }
  };

  const createAttendanceSession = async (sessionData: Omit<AttendanceSession, 'id' | 'created_at'>) => {
    try {
      const response = await apiGateway.insert('attendance_sessions', sessionData);
      
      if (response.success) {
        await fetchAttendanceData();
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to create attendance session' };
    }
  };

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

  const generateQRCode = async (sessionId: string) => {
    try {
      const qrCode = `ATTENDANCE_${sessionId}_${Date.now()}`;
      
      const response = await apiGateway.update('attendance_sessions', 
        { qr_code: qrCode }, 
        { id: sessionId }
      );

      if (response.success) {
        await fetchAttendanceData();
        return { success: true, qrCode };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to generate QR code' };
    }
  };

  return {
    attendanceRecords,
    sessions,
    loading,
    error,
    markAttendance,
    createAttendanceSession,
    getAttendanceStatistics,
    generateQRCode,
    refetch: fetchAttendanceData
  };
};
