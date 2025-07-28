
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Users, 
  Upload, 
  MessageSquare,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';

interface RecentActivityProps {
  activities: any[];
  userType: string;
}

const RecentActivity = ({ activities, userType }: RecentActivityProps) => {
  // Mock activities based on user type
  const getMockActivities = () => {
    const baseActivities = {
      student: [
        {
          id: 1,
          type: 'assignment',
          title: 'Submitted Database Project',
          description: 'Successfully submitted the database design project for CS301',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: FileText,
          color: 'text-blue-600',
          status: 'completed'
        },
        {
          id: 2,
          type: 'attendance',
          title: 'Attended Data Structures Class',
          description: 'Marked present in today\'s lecture',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          icon: CheckCircle,
          color: 'text-green-600',
          status: 'completed'
        },
        {
          id: 3,
          type: 'forum',
          title: 'Posted in Discussion Forum',
          description: 'Asked a question about binary trees in CS202 forum',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          icon: MessageSquare,
          color: 'text-purple-600',
          status: 'completed'
        },
        {
          id: 4,
          type: 'grade',
          title: 'Received Grade',
          description: 'Got 85% on the midterm examination',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: Award,
          color: 'text-yellow-600',
          status: 'completed'
        }
      ],
      faculty: [
        {
          id: 1,
          type: 'grading',
          title: 'Graded 15 Assignments',
          description: 'Completed grading for Database Systems project submissions',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          icon: Award,
          color: 'text-blue-600',
          status: 'completed'
        },
        {
          id: 2,
          type: 'attendance',
          title: 'Marked Class Attendance',
          description: '28 out of 30 students present in CS301 lecture',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          icon: Users,
          color: 'text-green-600',
          status: 'completed'
        },
        {
          id: 3,
          type: 'material',
          title: 'Uploaded Lecture Notes',
          description: 'Added Week 8 materials for Computer Networks course',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          icon: Upload,
          color: 'text-purple-600',
          status: 'completed'
        },
        {
          id: 4,
          type: 'schedule',
          title: 'Updated Class Schedule',
          description: 'Modified timings for next week\'s practical sessions',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: Calendar,
          color: 'text-yellow-600',
          status: 'completed'
        }
      ],
      admin: [
        {
          id: 1,
          type: 'user',
          title: 'Added New Faculty Member',
          description: 'Successfully onboarded Dr. Sarah Johnson to Computer Science department',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: Users,
          color: 'text-blue-600',
          status: 'completed'
        },
        {
          id: 2,
          type: 'course',
          title: 'Updated Course Catalog',
          description: 'Added 3 new courses for the upcoming semester',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          icon: FileText,
          color: 'text-green-600',
          status: 'completed'
        },
        {
          id: 3,
          type: 'system',
          title: 'System Maintenance',
          description: 'Completed scheduled backup and security updates',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          icon: CheckCircle,
          color: 'text-purple-600',
          status: 'completed'
        }
      ],
      parent: [
        {
          id: 1,
          type: 'grade',
          title: 'Viewed Child\'s Grades',
          description: 'Checked latest test scores for Mathematics and Science',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          icon: Award,
          color: 'text-blue-600',
          status: 'completed'
        },
        {
          id: 2,
          type: 'payment',
          title: 'Fee Payment Made',
          description: 'Successfully paid semester fees online',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: CheckCircle,
          color: 'text-green-600',
          status: 'completed'
        }
      ]
    };

    return baseActivities[userType as keyof typeof baseActivities] || [];
  };

  const recentActivities = activities.length > 0 ? activities : getMockActivities();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest actions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    {getStatusBadge(activity.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{getTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
