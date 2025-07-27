
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

const SystemArchitecture: React.FC = () => {
  const phases = [
    {
      id: 1,
      title: 'Core Infrastructure & Fixes',
      status: 'in-progress',
      items: [
        { name: 'Fix PermissionWrapper', status: 'completed' },
        { name: 'Refactor large components', status: 'in-progress' },
        { name: 'Database optimization', status: 'pending' },
        { name: 'API gateway setup', status: 'pending' },
        { name: 'Enhanced security', status: 'completed' }
      ]
    },
    {
      id: 2,
      title: 'Student Information System (SIS)',
      status: 'pending',
      items: [
        { name: 'Student profile enhancement', status: 'pending' },
        { name: 'Faculty profile enhancement', status: 'pending' },
        { name: 'Academic records management', status: 'pending' },
        { name: 'Enrollment management', status: 'pending' },
        { name: 'Transcript generation', status: 'pending' }
      ]
    },
    {
      id: 3,
      title: 'Learning Management System (LMS)',
      status: 'pending',
      items: [
        { name: 'Course content management', status: 'pending' },
        { name: 'Assignment & quiz system', status: 'pending' },
        { name: 'Discussion forums', status: 'pending' },
        { name: 'Progress tracking', status: 'pending' },
        { name: 'Learning analytics', status: 'pending' }
      ]
    },
    {
      id: 4,
      title: 'Attendance & Timetable Integration',
      status: 'pending',
      items: [
        { name: 'Smart scheduling', status: 'pending' },
        { name: 'Attendance integration', status: 'pending' },
        { name: 'Timetable management', status: 'pending' },
        { name: 'Reporting system', status: 'pending' },
        { name: 'QR code attendance', status: 'pending' }
      ]
    },
    {
      id: 5,
      title: 'Examination & Evaluation',
      status: 'pending',
      items: [
        { name: 'Exam scheduling', status: 'pending' },
        { name: 'Hall ticket generation', status: 'pending' },
        { name: 'Online examination', status: 'pending' },
        { name: 'Evaluation management', status: 'pending' },
        { name: 'Result publication', status: 'pending' }
      ]
    },
    {
      id: 6,
      title: 'Enhanced Communication',
      status: 'pending',
      items: [
        { name: 'Multi-channel communication', status: 'pending' },
        { name: 'Real-time notifications', status: 'pending' },
        { name: 'Announcement management', status: 'pending' },
        { name: 'Parent-teacher communication', status: 'pending' },
        { name: 'SMS/Email integration', status: 'pending' }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'default',
      'in-progress': 'secondary',
      'pending': 'outline'
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'destructive'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Architecture - Version 2</h2>
        <p className="text-muted-foreground">Implementation Phases</p>
      </div>

      <div className="grid gap-6">
        {phases.map((phase) => (
          <Card key={phase.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Phase {phase.id}: {phase.title}</CardTitle>
                {getStatusBadge(phase.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {phase.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span className={`text-sm ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Current Progress</h4>
            <p className="text-sm text-muted-foreground">
              Phase 1 is currently in progress. Core infrastructure improvements have been implemented including:
              - Enhanced authentication system with proper session management
              - Improved permission system with user profile integration
              - Component refactoring for better maintainability
              - Security enhancements with comprehensive logging
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Next Steps</h4>
            <p className="text-sm text-muted-foreground">
              After completing Phase 1, we'll move to Phase 2 (SIS Integration) which will enhance the student and faculty profiles with comprehensive academic record management.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemArchitecture;
