import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

const SystemArchitecture: React.FC = () => {
  const phases = [
    {
      id: 1,
      title: 'Core Infrastructure & Fixes',
      status: 'in-progress' as const,
      items: [
        { name: 'Fix PermissionWrapper', status: 'completed' as const },
        { name: 'Refactor large components', status: 'in-progress' as const },
        { name: 'Database optimization', status: 'pending' as const },
        { name: 'API gateway setup', status: 'pending' as const },
        { name: 'Enhanced security', status: 'completed' as const }
      ]
    },
    {
      id: 2,
      title: 'Student Information System (SIS)',
      status: 'pending' as const,
      items: [
        { name: 'Student profile enhancement', status: 'pending' as const },
        { name: 'Faculty profile enhancement', status: 'pending' as const },
        { name: 'Academic records management', status: 'pending' as const },
        { name: 'Enrollment management', status: 'pending' as const },
        { name: 'Transcript generation', status: 'pending' as const }
      ]
    },
    {
      id: 3,
      title: 'Learning Management System (LMS)',
      status: 'pending' as const,
      items: [
        { name: 'Course content management', status: 'pending' as const },
        { name: 'Assignment & quiz system', status: 'pending' as const },
        { name: 'Discussion forums', status: 'pending' as const },
        { name: 'Progress tracking', status: 'pending' as const },
        { name: 'Learning analytics', status: 'pending' as const }
      ]
    },
    {
      id: 4,
      title: 'Attendance & Timetable Integration',
      status: 'pending' as const,
      items: [
        { name: 'Smart scheduling', status: 'pending' as const },
        { name: 'Attendance integration', status: 'pending' as const },
        { name: 'Timetable management', status: 'pending' as const },
        { name: 'Reporting system', status: 'pending' as const },
        { name: 'QR code attendance', status: 'pending' as const }
      ]
    },
    {
      id: 5,
      title: 'Examination & Evaluation',
      status: 'pending' as const,
      items: [
        { name: 'Exam scheduling', status: 'pending' as const },
        { name: 'Hall ticket generation', status: 'pending' as const },
        { name: 'Online examination', status: 'pending' as const },
        { name: 'Evaluation management', status: 'pending' as const },
        { name: 'Result publication', status: 'pending' as const }
      ]
    },
    {
      id: 6,
      title: 'Enhanced Communication',
      status: 'pending' as const,
      items: [
        { name: 'Multi-channel communication', status: 'pending' as const },
        { name: 'Real-time notifications', status: 'pending' as const },
        { name: 'Announcement management', status: 'pending' as const },
        { name: 'Parent-teacher communication', status: 'pending' as const },
        { name: 'SMS/Email integration', status: 'pending' as const }
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
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      'completed': 'default',
      'in-progress': 'secondary',
      'pending': 'outline'
    };
    
    const variant = variants[status] || 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
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
