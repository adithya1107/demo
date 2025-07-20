
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Calendar, Users, Award, MessageSquare } from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AlumniDashboardProps {
  user: any;
}

const AlumniDashboard = ({ user }: AlumniDashboardProps) => {
  const [alumniData, setAlumniData] = useState({
    eventsAttended: 0,
    networkConnections: 0,
    yearsGraduated: 'N/A'
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlumniData();
  }, [user]);

  const fetchAlumniData = async () => {
    try {
      // Fetch alumni events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('college_id', user.college_id)
        .eq('event_type', 'alumni')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3);

      if (!eventsError && events) {
        setUpcomingEvents(events);
      }

      // Fetch event registrations count
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('user_id', user.id);

      if (!regError && registrations) {
        setAlumniData(prev => ({
          ...prev,
          eventsAttended: registrations.length
        }));
      }

      // Calculate years since graduation (mock data for now)
      const currentYear = new Date().getFullYear();
      const graduationYear = 2019; // This would come from user profile
      const yearsGraduated = currentYear - graduationYear;
      
      setAlumniData(prev => ({
        ...prev,
        yearsGraduated: yearsGraduated.toString(),
        networkConnections: 0 // Would be calculated from actual network data
      }));

    } catch (error) {
      console.error('Error fetching alumni data:', error);
    } finally {
      setLoading(false);
    }
  };

  const alumniStats = [
    {
      title: 'Years Since Graduation',
      value: alumniData.yearsGraduated,
      icon: GraduationCap,
      color: 'text-role-alumni',
      permission: 'view_personal_dashboard' as const
    },
    {
      title: 'Events Attended',
      value: alumniData.eventsAttended.toString(),
      icon: Calendar,
      color: 'text-green-600',
      permission: 'alumni_events' as const
    },
    {
      title: 'Network Connections',
      value: alumniData.networkConnections.toString(),
      icon: Users,
      color: 'text-purple-600',
      permission: 'join_forums' as const
    }
  ];

  const quickActions = [
    {
      title: 'Alumni Events',
      description: 'View and register for upcoming events',
      icon: Calendar,
      color: 'bg-green-50 text-green-600',
      permission: 'alumni_events' as const,
      action: () => {
        const eventsElement = document.querySelector('[data-sidebar-item="events"]');
        if (eventsElement) {
          (eventsElement as HTMLElement).click();
        } else {
          toast({
            title: 'Alumni Events',
            description: 'Navigate to Events section to view upcoming events.',
          });
        }
      }
    },
    {
      title: 'Join Discussion',
      description: 'Connect with fellow alumni',
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-600',
      permission: 'join_forums' as const,
      action: () => {
        const networkingElement = document.querySelector('[data-sidebar-item="networking"]');
        if (networkingElement) {
          (networkingElement as HTMLElement).click();
        } else {
          toast({
            title: 'Networking',
            description: 'Navigate to Networking section to connect with alumni.',
          });
        }
      }
    },
    {
      title: 'Request Certificate',
      description: 'Apply for academic documents',
      icon: Award,
      color: 'bg-yellow-50 text-yellow-600',
      permission: 'request_certificates' as const,
      action: () => {
        const documentsElement = document.querySelector('[data-sidebar-item="documents"]');
        if (documentsElement) {
          (documentsElement as HTMLElement).click();
        } else {
          toast({
            title: 'Documents',
            description: 'Navigate to Documents section to request certificates.',
          });
        }
      }
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-role-alumni" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <GraduationCap className="h-6 w-6 text-role-alumni" />
            <span>Welcome back, {user.first_name} {user.last_name}!</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Alumni ID: {user.user_code} | Class of 2019 | Computer Science
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {alumniStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <PermissionWrapper key={index} permission={stat.permission}>
              <Card className="border-white/10 bg-card/50 backdrop-blur-sm hover:border-role-alumni/20 transition-all duration-300 hover-translate-up">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-role-alumni/10">
                      <Icon className="h-6 w-6 text-role-alumni" />
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
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
            <CardDescription>Connect with your alma mater</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <PermissionWrapper key={index} permission={action.permission}>
                  <div 
                    onClick={action.action}
                    className="flex items-center space-x-4 p-4 rounded-lg border border-white/10 hover:border-role-alumni/20 hover:bg-white/5 cursor-pointer transition-all duration-300 hover-translate-up"
                  >
                    <div className="p-3 rounded-lg bg-role-alumni/10">
                      <Icon className="h-5 w-5 text-role-alumni" />
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

        {/* Recent Activities */}
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Recent Activities</CardTitle>
            <CardDescription>Your latest alumni activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300">
                    <div className="w-2 h-2 bg-role-alumni rounded-full mt-3 animate-pulse-indicator"></div>
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-white/40 font-mono">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alumni Events */}
      <PermissionWrapper permission="alumni_events">
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Upcoming Alumni Events</CardTitle>
            <CardDescription>Stay connected with your alma mater</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5 hover:border-role-alumni/20 transition-colors duration-300">
                    <div>
                      <h4 className="font-medium text-card-foreground">{event.event_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.start_date).toLocaleDateString()} • {event.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-role-alumni/10 text-role-alumni border-role-alumni/20">
                        Upcoming
                      </Badge>
                      <div className="mt-2">
                        <Button size="sm" variant="outline" className="border-role-alumni/30 hover:bg-role-alumni/10">
                          Register
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </PermissionWrapper>
    </div>
  );
};

export default AlumniDashboard;
