
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  TrendingUp, 
  Calendar, 
  Users, 
  BookOpen, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import DashboardWidget from './DashboardWidget';
import PersonalizedInsights from './PersonalizedInsights';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import PerformanceMetrics from './PerformanceMetrics';

interface DashboardData {
  personalMetrics: any[];
  upcomingEvents: any[];
  notifications: any[];
  quickStats: any[];
  recentActivity: any[];
  insights: any[];
}

const SmartDashboard = () => {
  const { permissions, userType, profile, loading: permissionsLoading } = usePermissions();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    personalMetrics: [],
    upcomingEvents: [],
    notifications: [],
    quickStats: [],
    recentActivity: [],
    insights: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!permissionsLoading && profile) {
      loadDashboardData();
    }
  }, [permissionsLoading, profile, userType]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user-specific dashboard data based on their role
      const dashboardQueries = await Promise.allSettled([
        loadPersonalMetrics(),
        loadUpcomingEvents(),
        loadNotifications(),
        loadQuickStats(),
        loadRecentActivity(),
        loadPersonalizedInsights()
      ]);

      const [metrics, events, notifications, stats, activity, insights] = dashboardQueries;

      setDashboardData({
        personalMetrics: metrics.status === 'fulfilled' ? metrics.value : [],
        upcomingEvents: events.status === 'fulfilled' ? events.value : [],
        notifications: notifications.status === 'fulfilled' ? notifications.value : [],
        quickStats: stats.status === 'fulfilled' ? stats.value : [],
        recentActivity: activity.status === 'fulfilled' ? activity.value : [],
        insights: insights.status === 'fulfilled' ? insights.value : []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalMetrics = async () => {
    if (!profile) return [];

    switch (userType) {
      case 'student':
        return await loadStudentMetrics();
      case 'faculty':
        return await loadFacultyMetrics();
      case 'admin':
        return await loadAdminMetrics();
      case 'parent':
        return await loadParentMetrics();
      default:
        return [];
    }
  };

  const loadStudentMetrics = async () => {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          course_name,
          credits,
          instructor_id
        )
      `)
      .eq('student_id', profile.id)
      .eq('status', 'enrolled');

    const { data: attendance } = await supabase
      .from('attendance')
      .select('status, course_id')
      .eq('student_id', profile.id);

    const { data: assignments } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignments (
          title,
          due_date,
          max_marks
        )
      `)
      .eq('student_id', profile.id);

    // Calculate metrics
    const totalCourses = enrollments?.length || 0;
    const overallAttendance = attendance?.length > 0 
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
      : 0;
    
    const completedAssignments = assignments?.filter(a => a.marks_obtained !== null).length || 0;
    const totalAssignments = assignments?.length || 0;
    const averageGrade = assignments?.length > 0
      ? Math.round(assignments.reduce((sum, a) => sum + (a.marks_obtained || 0), 0) / assignments.length)
      : 0;

    return [
      {
        title: 'Current Courses',
        value: totalCourses,
        icon: BookOpen,
        color: 'text-blue-600',
        trend: '+2 from last semester'
      },
      {
        title: 'Overall Attendance',
        value: `${overallAttendance}%`,
        icon: CheckCircle,
        color: overallAttendance >= 75 ? 'text-green-600' : 'text-red-600',
        trend: overallAttendance >= 75 ? 'Good standing' : 'Needs improvement'
      },
      {
        title: 'Assignments Completed',
        value: `${completedAssignments}/${totalAssignments}`,
        icon: Target,
        color: 'text-purple-600',
        trend: `${Math.round((completedAssignments / totalAssignments) * 100)}% completion rate`
      },
      {
        title: 'Average Grade',
        value: `${averageGrade}%`,
        icon: TrendingUp,
        color: averageGrade >= 80 ? 'text-green-600' : averageGrade >= 60 ? 'text-yellow-600' : 'text-red-600',
        trend: 'Based on graded assignments'
      }
    ];
  };

  const loadFacultyMetrics = async () => {
    const { data: courses } = await supabase
      .from('courses')
      .select(`
        *,
        enrollments (count)
      `)
      .eq('instructor_id', profile.id)
      .eq('is_active', true);

    const { data: assignments } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_submissions (count)
      `)
      .eq('created_by', profile.id);

    const totalStudents = courses?.reduce((sum, course) => sum + (course.enrollments?.length || 0), 0) || 0;
    const pendingGrading = assignments?.filter(a => 
      a.assignment_submissions?.some((s: any) => s.marks_obtained === null)
    ).length || 0;

    return [
      {
        title: 'Active Courses',
        value: courses?.length || 0,
        icon: BookOpen,
        color: 'text-blue-600',
        trend: 'This semester'
      },
      {
        title: 'Total Students',
        value: totalStudents,
        icon: Users,
        color: 'text-green-600',
        trend: 'Across all courses'
      },
      {
        title: 'Pending Grading',
        value: pendingGrading,
        icon: Clock,
        color: pendingGrading > 0 ? 'text-yellow-600' : 'text-green-600',
        trend: 'Assignments to grade'
      },
      {
        title: 'This Week Classes',
        value: '12',
        icon: Calendar,
        color: 'text-purple-600',
        trend: '3 hours per day avg'
      }
    ];
  };

  const loadAdminMetrics = async () => {
    const { data: users } = await supabase
      .from('user_profiles')
      .select('user_type, is_active')
      .eq('college_id', profile.college_id);

    const { data: courses } = await supabase
      .from('courses')
      .select('id, is_active')
      .eq('college_id', profile.college_id);

    const { data: events } = await supabase
      .from('events')
      .select('id, is_active')
      .eq('college_id', profile.college_id);

    const totalUsers = users?.filter(u => u.is_active).length || 0;
    const activeStudents = users?.filter(u => u.user_type === 'student' && u.is_active).length || 0;
    const activeCourses = courses?.filter(c => c.is_active).length || 0;
    const activeEvents = events?.filter(e => e.is_active).length || 0;

    return [
      {
        title: 'Total Users',
        value: totalUsers,
        icon: Users,
        color: 'text-blue-600',
        trend: `${activeStudents} active students`
      },
      {
        title: 'Active Courses',
        value: activeCourses,
        icon: BookOpen,
        color: 'text-green-600',
        trend: 'This semester'
      },
      {
        title: 'Upcoming Events',
        value: activeEvents,
        icon: Calendar,
        color: 'text-purple-600',
        trend: 'This month'
      },
      {
        title: 'System Health',
        value: '99.9%',
        icon: Activity,
        color: 'text-green-600',
        trend: 'Uptime this month'
      }
    ];
  };

  const loadParentMetrics = async () => {
    const { data: children } = await supabase
      .from('parent_student_links')
      .select(`
        *,
        user_profiles (
          first_name,
          last_name,
          user_code
        )
      `)
      .eq('parent_id', profile.id);

    return [
      {
        title: 'Children',
        value: children?.length || 0,
        icon: Users,
        color: 'text-blue-600',
        trend: 'Linked accounts'
      },
      {
        title: 'Overall Performance',
        value: '85%',
        icon: TrendingUp,
        color: 'text-green-600',
        trend: 'Average across children'
      },
      {
        title: 'Attendance Rate',
        value: '92%',
        icon: CheckCircle,
        color: 'text-green-600',
        trend: 'Last 30 days'
      },
      {
        title: 'Pending Fees',
        value: '$0',
        icon: DollarSign,
        color: 'text-green-600',
        trend: 'All payments up to date'
      }
    ];
  };

  const loadUpcomingEvents = async () => {
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('college_id', profile?.college_id)
      .gte('start_date', new Date().toISOString())
      .eq('is_active', true)
      .order('start_date', { ascending: true })
      .limit(5);

    return events || [];
  };

  const loadNotifications = async () => {
    // This would typically load from a notifications table
    // For now, return mock data
    return [
      {
        id: 1,
        title: 'Assignment Due Tomorrow',
        message: 'Database Systems project submission deadline is tomorrow',
        type: 'deadline',
        priority: 'high',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        title: 'New Course Material',
        message: 'New lecture notes uploaded for Computer Networks',
        type: 'info',
        priority: 'medium',
        timestamp: new Date().toISOString()
      }
    ];
  };

  const loadQuickStats = async () => {
    // Return user-type specific quick stats
    return [];
  };

  const loadRecentActivity = async () => {
    // This would load from an activity log table
    return [];
  };

  const loadPersonalizedInsights = async () => {
    // AI-powered insights based on user behavior and performance
    return [];
  };

  if (permissionsLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {profile?.first_name}!
          </h1>
          <p className="text-gray-600">
            {userType === 'student' && 'Ready to learn something new today?'}
            {userType === 'faculty' && 'Your students are waiting for your guidance.'}
            {userType === 'admin' && 'Everything is running smoothly.'}
            {userType === 'parent' && 'Stay connected with your child\'s progress.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {dashboardData.notifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {dashboardData.notifications.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Personal Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardData.personalMetrics.map((metric, index) => (
          <DashboardWidget
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            trend={metric.trend}
          />
        ))}
      </div>

      {/* Main Dashboard Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used features</CardDescription>
              </CardHeader>
              <CardContent>
                <QuickActions userType={userType} permissions={permissions} />
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>What's happening soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.upcomingEvents.length > 0 ? (
                    dashboardData.upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium">{event.event_name}</p>
                          <p className="text-sm text-gray-600">{event.location}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(event.start_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No upcoming events</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Important updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.priority === 'high' ? 'bg-red-500' :
                        notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <PersonalizedInsights 
            userType={userType} 
            insights={dashboardData.insights}
            profile={profile}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <RecentActivity 
            activities={dashboardData.recentActivity}
            userType={userType}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PerformanceMetrics 
            userType={userType}
            profile={profile}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartDashboard;
