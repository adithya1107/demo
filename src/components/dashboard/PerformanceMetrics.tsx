
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';

interface PerformanceMetricsProps {
  userType: string;
  profile: any;
}

const PerformanceMetrics = ({ userType, profile }: PerformanceMetricsProps) => {
  const [metricsData, setMetricsData] = useState<any>({});

  useEffect(() => {
    generateMetricsData();
  }, [userType]);

  const generateMetricsData = () => {
    const mockData = {
      student: {
        gradesTrend: [
          { month: 'Jan', grade: 78 },
          { month: 'Feb', grade: 82 },
          { month: 'Mar', grade: 85 },
          { month: 'Apr', grade: 88 },
          { month: 'May', grade: 85 },
          { month: 'Jun', grade: 90 }
        ],
        subjectPerformance: [
          { subject: 'Math', score: 85 },
          { subject: 'Science', score: 92 },
          { subject: 'English', score: 78 },
          { subject: 'History', score: 88 },
          { subject: 'CS', score: 95 }
        ],
        attendanceData: [
          { name: 'Present', value: 85, color: '#10B981' },
          { name: 'Absent', value: 15, color: '#EF4444' }
        ]
      },
      faculty: {
        classEngagement: [
          { month: 'Jan', engagement: 78 },
          { month: 'Feb', engagement: 82 },
          { month: 'Mar', engagement: 85 },
          { month: 'Apr', engagement: 88 },
          { month: 'May', engagement: 85 },
          { month: 'Jun', engagement: 90 }
        ],
        coursePerformance: [
          { course: 'CS101', satisfaction: 4.2 },
          { course: 'CS201', satisfaction: 4.5 },
          { course: 'CS301', satisfaction: 4.8 },
          { course: 'CS401', satisfaction: 4.3 }
        ],
        gradingEfficiency: [
          { name: 'On Time', value: 85, color: '#10B981' },
          { name: 'Delayed', value: 15, color: '#F59E0B' }
        ]
      },
      admin: {
        systemUsage: [
          { month: 'Jan', users: 1200 },
          { month: 'Feb', users: 1350 },
          { month: 'Mar', users: 1450 },
          { month: 'Apr', users: 1600 },
          { month: 'May', users: 1750 },
          { month: 'Jun', users: 1900 }
        ],
        departmentActivity: [
          { department: 'CS', activity: 95 },
          { department: 'Math', activity: 87 },
          { department: 'Physics', activity: 92 },
          { department: 'Chemistry', activity: 88 },
          { department: 'Biology', activity: 90 }
        ],
        systemHealth: [
          { name: 'Uptime', value: 99.9, color: '#10B981' },
          { name: 'Issues', value: 0.1, color: '#EF4444' }
        ]
      }
    };

    setMetricsData(mockData[userType as keyof typeof mockData] || {});
  };

  const renderStudentMetrics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Grade Trends</CardTitle>
          <CardDescription>Your academic performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsData.gradesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="grade" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
          <CardDescription>Current scores by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData.subjectPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>Your attendance rate this semester</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metricsData.attendanceData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metricsData.attendanceData?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Goals</CardTitle>
          <CardDescription>Track your academic targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall GPA Goal</span>
              <span className="text-sm text-gray-600">3.5 / 4.0</span>
            </div>
            <Progress value={87.5} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Attendance Target</span>
              <span className="text-sm text-gray-600">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Assignment Completion</span>
              <span className="text-sm text-gray-600">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFacultyMetrics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Class Engagement</CardTitle>
          <CardDescription>Student engagement levels in your classes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsData.classEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="engagement" stroke="#8B5CF6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Satisfaction</CardTitle>
          <CardDescription>Student feedback ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData.coursePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="satisfaction" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderAdminMetrics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>System Usage</CardTitle>
          <CardDescription>Active users over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsData.systemUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Activity</CardTitle>
          <CardDescription>Activity levels by department</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData.departmentActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="activity" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {userType === 'student' && renderStudentMetrics()}
      {userType === 'faculty' && renderFacultyMetrics()}
      {userType === 'admin' && renderAdminMetrics()}
      {userType === 'parent' && (
        <Card>
          <CardHeader>
            <CardTitle>Child's Performance Overview</CardTitle>
            <CardDescription>Academic progress and key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Performance</span>
                  <span className="text-sm text-gray-600">88%</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Attendance Rate</span>
                  <span className="text-sm text-gray-600">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceMetrics;
