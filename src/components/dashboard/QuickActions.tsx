
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Upload, 
  DollarSign, 
  FileText, 
  Award,
  MessageSquare,
  Settings,
  BarChart3
} from 'lucide-react';

interface QuickActionsProps {
  userType: string;
  permissions: any;
}

const QuickActions = ({ userType, permissions }: QuickActionsProps) => {
  const navigate = useNavigate();

  const getActionsForUserType = () => {
    switch (userType) {
      case 'student':
        return [
          {
            title: 'View Assignments',
            icon: BookOpen,
            action: () => navigate('/student'),
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            permission: 'view_submit_assignments'
          },
          {
            title: 'Check Attendance',
            icon: Calendar,
            action: () => navigate('/student'),
            color: 'bg-green-50 text-green-600 hover:bg-green-100',
            permission: 'view_attendance'
          },
          {
            title: 'Pay Fees',
            icon: DollarSign,
            action: () => navigate('/student'),
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
            permission: 'make_payments'
          },
          {
            title: 'Join Discussion',
            icon: MessageSquare,
            action: () => navigate('/student'),
            color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
            permission: 'join_forums'
          }
        ];
      
      case 'faculty':
        return [
          {
            title: 'Grade Assignments',
            icon: Award,
            action: () => navigate('/faculty'),
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            permission: 'review_assignments'
          },
          {
            title: 'Mark Attendance',
            icon: Users,
            action: () => navigate('/faculty'),
            color: 'bg-green-50 text-green-600 hover:bg-green-100',
            permission: 'mark_attendance'
          },
          {
            title: 'Upload Material',
            icon: Upload,
            action: () => navigate('/faculty'),
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
            permission: 'upload_materials'
          },
          {
            title: 'View Analytics',
            icon: BarChart3,
            action: () => navigate('/faculty'),
            color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
            permission: 'view_attendance'
          }
        ];
      
      case 'admin':
        return [
          {
            title: 'Manage Users',
            icon: Users,
            action: () => navigate('/admin'),
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            permission: 'view_personal_dashboard'
          },
          {
            title: 'Course Management',
            icon: BookOpen,
            action: () => navigate('/admin'),
            color: 'bg-green-50 text-green-600 hover:bg-green-100',
            permission: 'view_personal_dashboard'
          },
          {
            title: 'System Settings',
            icon: Settings,
            action: () => navigate('/admin'),
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
            permission: 'view_personal_dashboard'
          },
          {
            title: 'Analytics',
            icon: BarChart3,
            action: () => navigate('/admin'),
            color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
            permission: 'view_personal_dashboard'
          }
        ];
      
      case 'parent':
        return [
          {
            title: 'View Grades',
            icon: Award,
            action: () => navigate('/parent'),
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
            permission: 'view_child_grades'
          },
          {
            title: 'Check Attendance',
            icon: Calendar,
            action: () => navigate('/parent'),
            color: 'bg-green-50 text-green-600 hover:bg-green-100',
            permission: 'view_child_attendance'
          },
          {
            title: 'Pay Fees',
            icon: DollarSign,
            action: () => navigate('/parent'),
            color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
            permission: 'make_child_payments'
          },
          {
            title: 'Contact Support',
            icon: MessageSquare,
            action: () => navigate('/parent'),
            color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
            permission: 'support_tickets'
          }
        ];
      
      default:
        return [];
    }
  };

  const actions = getActionsForUserType();

  return (
    <div className="space-y-2">
      {actions.map((action, index) => {
        if (action.permission && !permissions[action.permission]) {
          return null;
        }
        
        const Icon = action.icon;
        
        return (
          <Button
            key={index}
            variant="ghost"
            className={`w-full justify-start ${action.color}`}
            onClick={action.action}
          >
            <Icon className="w-4 h-4 mr-3" />
            {action.title}
          </Button>
        );
      })}
    </div>
  );
};

export default QuickActions;
