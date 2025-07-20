
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Calendar, DollarSign, Award, AlertCircle } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ParentDashboardProps {
  user: any;
}

const ParentDashboard = ({ user }: ParentDashboardProps) => {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildrenData();
  }, [user]);

  const fetchChildrenData = async () => {
    try {
      // This would fetch real parent-student links from the database
      const { data, error } = await supabase
        .from('parent_student_links')
        .select(`
          *,
          user_profiles!parent_student_links_student_id_fkey (
            id,
            first_name,
            last_name,
            user_code
          )
        `)
        .eq('parent_id', user.id);

      if (error) {
        console.error('Error fetching children:', error);
        // For now, show empty state
        setChildren([]);
      } else {
        setChildren(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGrades = () => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Grade viewing feature will be available soon.',
    });
  };

  const handlePayFees = () => {
    toast({
      title: 'Payment Portal',
      description: 'Fee payment feature will be available soon.',
    });
  };

  const handleViewAttendance = () => {
    toast({
      title: 'Attendance Report',
      description: 'Attendance viewing feature will be available soon.',
    });
  };

  const handleContactSupport = () => {
    toast({
      title: 'Contact Support',
      description: 'For assistance, please email: support@colcord.edu or call: +91-8050661601',
    });
  };

  const quickActions = [
    {
      title: 'View Grades',
      description: 'Check your child\'s academic performance',
      icon: Award,
      color: 'bg-green-50 text-green-600',
      permission: 'view_child_grades' as const,
      action: handleViewGrades
    },
    {
      title: 'Pay Fees',
      description: 'Make fee payments for your child',
      icon: DollarSign,
      color: 'bg-blue-50 text-blue-600',
      permission: 'make_child_payments' as const,
      action: handlePayFees
    },
    {
      title: 'Attendance Report',
      description: 'View detailed attendance records',
      icon: Calendar,
      color: 'bg-purple-50 text-purple-600',
      permission: 'view_child_attendance' as const,
      action: handleViewAttendance
    },
    {
      title: 'Contact Support',
      description: 'Get help with any concerns',
      icon: AlertCircle,
      color: 'bg-yellow-50 text-yellow-600',
      permission: 'support_tickets' as const,
      action: handleContactSupport
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-role-parent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Welcome, {user.first_name} {user.last_name}!</span>
          </CardTitle>
          <CardDescription>
            Parent Portal | Monitor your child's academic progress
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Children Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Children</CardTitle>
          <CardDescription>Students linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {children.length > 0 ? (
            <div className="space-y-3">
              {children.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {link.user_profiles?.first_name} {link.user_profiles?.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {link.user_profiles?.user_code} • {link.relationship_type}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">Active Student</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground mb-2">No children linked to your account</p>
              <p className="text-sm text-muted-foreground">
                Contact support to link your child's account: support@colcord.edu
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <PermissionWrapper key={index} permission={action.permission}>
                <div 
                  onClick={action.action}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </PermissionWrapper>
            );
          })}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <AlertCircle className="h-5 w-5" />
            <span>Important Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-blue-700">
            <p>• To link your child's account, please contact the admin office</p>
            <p>• For fee payments and academic queries, use the quick actions above</p>
            <p>• Support is available Mon-Fri, 9:00 AM - 6:00 PM</p>
            <p>• Emergency contact: +91-8050661601</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboard;
