
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Award, Users } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';
import { supabase } from '@/integrations/supabase/client';

interface StudentDashboardProps {
  studentData: any;
}

const StudentDashboard = ({ studentData }: StudentDashboardProps) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [currentGrade, setCurrentGrade] = useState('N/A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [studentData]);

  const fetchStudentData = async () => {
    try {
      // Fetch enrolled courses
      const { data: courses, error: coursesError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            course_name,
            course_code,
            instructor_id,
            user_profiles!courses_instructor_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('student_id', studentData.id);

      if (!coursesError && courses) {
        setEnrolledCourses(courses);
      }

      // Fetch upcoming assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          courses (course_name)
        `)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

      if (!assignmentsError && assignments) {
        setUpcomingAssignments(assignments);
      }

      // Calculate current CGPA (mock calculation)
      if (courses && courses.length > 0) {
        const gradesCount = courses.filter(c => c.grade).length;
        if (gradesCount > 0) {
          setCurrentGrade('8.5'); // This would be calculated from actual grades
        }
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    {
      title: 'Enrolled Courses',
      value: enrolledCourses.length.toString(),
      icon: BookOpen,
      color: 'text-blue-600',
      permission: 'view_submit_assignments' as const
    },
    {
      title: 'Upcoming Assignments',
      value: upcomingAssignments.length.toString(),
      icon: Calendar,
      color: 'text-orange-600',
      permission: 'view_submit_assignments' as const
    },
    {
      title: 'Current CGPA',
      value: currentGrade,
      icon: Award,
      color: 'text-green-600',
      permission: 'view_grades' as const
    }
  ];

  const quickActions = [
    {
      title: 'View Assignments',
      description: 'Check and submit pending assignments',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
      permission: 'view_submit_assignments' as const,
      action: () => window.location.hash = '#assignments'
    },
    {
      title: 'Join Discussion',
      description: 'Participate in course forums',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      permission: 'join_forums' as const,
      action: () => window.location.hash = '#communication'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-role-student" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Section */}
      <div className="bg-card border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Welcome back, {studentData.first_name}
            </h1>
            <p className="text-muted-foreground">Student ID: {studentData.user_code}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current CGPA</p>
            <p className="text-2xl font-bold text-role-student">{currentGrade}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PermissionWrapper key={index} permission={stat.permission}>
              <Card className="hover-translate-up transition-all duration-300 hover:border-role-student/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <Icon className="h-6 w-6 text-role-student" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PermissionWrapper>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-card-foreground">Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <PermissionWrapper key={index} permission={action.permission}>
                  <div 
                    onClick={action.action}
                    className="flex items-center space-x-4 p-4 rounded-lg border border-white/10 hover:border-role-student/20 hover:bg-white/5 cursor-pointer transition-all duration-300 hover-translate-up"
                  >
                    <div className="p-3 rounded-lg bg-role-student/10">
                      <Icon className="h-5 w-5 text-role-student" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </PermissionWrapper>
              );
            })}
          </CardContent>
        </Card>

        {/* Current Courses Preview */}
        <PermissionWrapper permission="view_submit_assignments">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-card-foreground">Current Courses</CardTitle>
              <CardDescription>Your enrolled courses this semester</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.slice(0, 3).map((enrollment: any, index) => (
                    <div key={index} className="p-4 border border-white/10 rounded-lg bg-white/5 hover:border-role-student/20 transition-all duration-300 hover-translate-up">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-card-foreground">{enrollment.courses?.course_name}</h4>
                        <Badge variant="secondary" className="bg-role-student/10 text-role-student border-role-student/20">
                          {enrollment.courses?.course_code}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {enrollment.courses?.user_profiles?.first_name} {enrollment.courses?.user_profiles?.last_name}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <span className="text-card-foreground font-medium capitalize">{enrollment.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No courses enrolled yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </PermissionWrapper>
      </div>
    </div>
  );
};

export default StudentDashboard;
