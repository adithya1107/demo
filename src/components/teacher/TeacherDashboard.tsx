import React from 'react';
import SmartDashboard from '@/components/dashboard/SmartDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, Calendar, Award, Upload } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';

interface TeacherDashboardProps {
  teacherData: any;
}

// Dashboard statistics configuration
const TEACHER_STATS = [
  {
    title: 'Courses Teaching',
    value: '4',
    icon: BookOpen,
    color: 'text-blue-600',
    permission: 'review_assignments' as const
  },
  {
    title: 'Total Students',
    value: '120',
    icon: Users,
    color: 'text-green-600',
    permission: 'view_attendance' as const
  },
  {
    title: 'Pending Assignments',
    value: '8',
    icon: FileText,
    color: 'text-orange-600',
    permission: 'review_assignments' as const
  },
  {
    title: 'Classes This Week',
    value: '12',
    icon: Calendar,
    color: 'text-purple-600',
    permission: 'mark_attendance' as const
  }
];

// Recent activities configuration
const RECENT_ACTIVITIES = [
  {
    title: 'Assignment Graded',
    description: 'Data Structures - 15 submissions reviewed',
    time: '1 hour ago',
    permission: 'review_assignments' as const
  },
  {
    title: 'Attendance Marked',
    description: 'Computer Networks - 30 students present',
    time: '3 hours ago',
    permission: 'mark_attendance' as const
  },
  {
    title: 'Material Uploaded',
    description: 'Database Systems - Lecture slides added',
    time: '1 day ago',
    permission: 'upload_materials' as const
  },
  {
    title: 'Grade Updated',
    description: 'Midterm scores published for CS301',
    time: '2 days ago',
    permission: 'assign_grades' as const
  }
];

// Quick actions configuration
const QUICK_ACTIONS = [
  {
    title: 'Grade Assignments',
    description: 'Review and grade pending submissions',
    icon: Award,
    color: 'bg-blue-50 text-blue-600',
    permission: 'review_assignments' as const
  },
  {
    title: 'Mark Attendance',
    description: 'Record student attendance for classes',
    icon: Users,
    color: 'bg-green-50 text-green-600',
    permission: 'mark_attendance' as const
  },
  {
    title: 'Upload Materials',
    description: 'Share lecture notes and resources',
    icon: Upload,
    color: 'bg-purple-50 text-purple-600',
    permission: 'upload_materials' as const
  },
  {
    title: 'Join Discussion',
    description: 'Participate in teacher forums',
    icon: FileText,
    color: 'bg-yellow-50 text-yellow-600',
    permission: 'join_forums' as const
  }
];

// Today's classes data
const TODAY_CLASSES = [
  { course: 'Data Structures & Algorithms', time: '09:00 - 10:30', room: 'Room 301', students: 35 },
  { course: 'Database Management Systems', time: '11:00 - 12:30', room: 'Room 205', students: 42 },
  { course: 'Computer Networks', time: '14:00 - 15:30', room: 'Lab 101', students: 28 }
];

const TeacherDashboard = ({ teacherData }: TeacherDashboardProps) => {
  return <SmartDashboard />;
};

export default TeacherDashboard;
