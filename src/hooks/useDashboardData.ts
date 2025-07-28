import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { useNotifications } from './useNotifications';
import { useGrades } from './useGrades';
import { useFees } from './useFees';
import { useCourses } from './useCourses';
import { useAttendance } from './useAttendance';
import { useEvents } from './useEvents';
import { enhancedApiGateway } from '@/utils/enhancedApiGateway';

export interface DashboardData {
  user: {
    profile: any;
    notifications: any;
    quickStats: any;
  };
  academic: {
    courses: any[];
    grades: any[];
    attendance: any;
    assignments: any[];
  };
  financial: {
    fees: any[];
    statistics: any;
  };
  events: {
    upcoming: any[];
    registrations: any[];
  };
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    lastUpdate: string;
  };
}

export const useDashboardData = () => {
  const { profile } = useUserProfile();
  const { notifications, unreadCount } = useNotifications();
  const { grades, getGradeStatistics } = useGrades();
  const { transactions, getFeeStatistics } = useFees();
  const { courses, assignments } = useCourses();
  const { attendanceRecords, getAttendanceStatistics } = useAttendance();
  const { events, getUpcomingEvents, getUserRegistrations } = useEvents();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      buildDashboardData();
    }
  }, [profile, notifications, grades, transactions, courses, attendanceRecords, events]);

  const buildDashboardData = async () => {
    try {
      setLoading(true);

      // Get additional statistics
      const gradeStats = getGradeStatistics();
      const feeStats = getFeeStatistics();
      const attendanceStats = getAttendanceStatistics();
      const upcomingEvents = getUpcomingEvents();
      const userRegistrations = getUserRegistrations();

      // Build comprehensive dashboard data
      const data: DashboardData = {
        user: {
          profile,
          notifications: {
            recent: notifications.slice(0, 5),
            unreadCount
          },
          quickStats: {
            totalNotifications: notifications.length,
            unreadNotifications: unreadCount,
            accountStatus: profile?.is_active ? 'active' : 'inactive'
          }
        },
        academic: {
          courses: courses.slice(0, 6), // Recent courses
          grades: grades.slice(0, 10), // Recent grades
          attendance: attendanceStats,
          assignments: assignments.filter(a => new Date(a.due_date) > new Date()).slice(0, 5) // Upcoming assignments
        },
        financial: {
          fees: transactions.slice(0, 5), // Recent transactions
          statistics: feeStats
        },
        events: {
          upcoming: upcomingEvents.slice(0, 5),
          registrations: userRegistrations
        },
        systemHealth: {
          status: 'healthy',
          lastUpdate: new Date().toISOString()
        }
      };

      setDashboardData(data);
    } catch (err) {
      setError('Failed to build dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    await buildDashboardData();
  };

  const getQuickActions = () => {
    const actions = [];

    if (profile?.user_type === 'student') {
      actions.push(
        { id: 'view-grades', label: 'View Grades', icon: 'BookOpen', href: '/student/grades' },
        { id: 'pay-fees', label: 'Pay Fees', icon: 'CreditCard', href: '/student/fees' },
        { id: 'view-attendance', label: 'View Attendance', icon: 'Calendar', href: '/student/attendance' }
      );
    } else if (profile?.user_type === 'faculty') {
      actions.push(
        { id: 'mark-attendance', label: 'Mark Attendance', icon: 'CheckCircle', href: '/teacher/attendance' },
        { id: 'grade-assignments', label: 'Grade Assignments', icon: 'FileText', href: '/teacher/gradebook' },
        { id: 'manage-courses', label: 'Manage Courses', icon: 'BookOpen', href: '/teacher/courses' }
      );
    } else if (profile?.user_type === 'admin') {
      actions.push(
        { id: 'user-management', label: 'User Management', icon: 'Users', href: '/admin/users' },
        { id: 'system-settings', label: 'System Settings', icon: 'Settings', href: '/admin/settings' },
        { id: 'reports', label: 'Reports', icon: 'BarChart', href: '/admin/reports' }
      );
    }

    return actions;
  };

  const getDashboardWidgets = () => {
    const widgets = [];

    if (profile?.user_type === 'student') {
      widgets.push(
        { id: 'grade-overview', title: 'Grade Overview', type: 'chart', data: grades },
        { id: 'attendance-summary', title: 'Attendance Summary', type: 'progress', data: getAttendanceStatistics() },
        { id: 'upcoming-assignments', title: 'Upcoming Assignments', type: 'list', data: assignments },
        { id: 'fee-status', title: 'Fee Status', type: 'summary', data: getFeeStatistics() }
      );
    } else if (profile?.user_type === 'faculty') {
      widgets.push(
        { id: 'course-overview', title: 'Course Overview', type: 'grid', data: courses },
        { id: 'recent-submissions', title: 'Recent Submissions', type: 'list', data: [] },
        { id: 'attendance-overview', title: 'Attendance Overview', type: 'chart', data: attendanceRecords }
      );
    } else if (profile?.user_type === 'admin') {
      widgets.push(
        { id: 'system-overview', title: 'System Overview', type: 'stats', data: {} },
        { id: 'user-activity', title: 'User Activity', type: 'chart', data: [] },
        { id: 'system-health', title: 'System Health', type: 'status', data: {} }
      );
    }

    return widgets;
  };

  return {
    dashboardData,
    loading,
    error,
    refreshDashboardData,
    getQuickActions,
    getDashboardWidgets
  };
};
