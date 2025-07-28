import React, { useState, useEffect } from 'react';
import SmartDashboard from '@/components/dashboard/SmartDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  Settings, 
  FileText, 
  BookOpen,
  Building,
  Calendar,
  DollarSign,
  MessageSquare,
  Archive,
  BarChart3,
  Bell,
  LogOut,
  Plus,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Import all admin components
import EnhancedUserManagement from './EnhancedUserManagement';
import RoleManagement from './RoleManagement';
import AuditLogs from './AuditLogs';
import SecuritySettings from './SecuritySettings';
import SystemSettings from './SystemSettings';
import CourseManagement from './CourseManagement';
import FacilityManagement from './FacilityManagement';
import EventManagement from './EventManagement';
import FinanceManagement from './FinanceManagement';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_code: string;
  user_type: 'student' | 'teacher' | 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  college_id: string;
  hierarchy_level: string;
}

interface AdminRole {
  role_type: string;
  permissions: any;
  assigned_at: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalEvents: number;
  monthlyRevenue: number;
  pendingApprovals: number;
}

interface AdminDashboardProps {
  sessionData?: any;
}

const AdminDashboard = ({ sessionData }: AdminDashboardProps) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    totalEvents: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    loadUserProfile();
    loadDashboardStats();
  }, [sessionData]);

  const loadUserProfile = async () => {
    try {
      console.log('Loading user profile with session data:', sessionData);
      
      if (sessionData && sessionData.user_id) {
        const userProfile: UserProfile = {
          id: sessionData.user_id,
          first_name: sessionData.first_name || 'Admin',
          last_name: sessionData.last_name || 'User',
          email: sessionData.email || '',
          user_code: sessionData.user_code || 'ADM001',
          user_type: sessionData.user_type || 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          college_id: sessionData.college_id || '',
          hierarchy_level: sessionData.user_type || 'admin'
        };

        setUserProfile(userProfile);

        // Load admin roles using the function to avoid RLS issues
        try {
          const { data: rolesData, error: rolesError } = await supabase
            .rpc('get_user_admin_roles', {
              user_uuid: sessionData.user_id,
              college_uuid: sessionData.college_id
            });

          if (rolesError) {
            console.error('Error loading admin roles:', rolesError);
            // Set default admin role if query fails
            setAdminRoles([{
              role_type: 'super_admin',
              permissions: { all: true },
              assigned_at: new Date().toISOString()
            }]);
          } else {
            const formattedRoles = rolesData?.map(role => ({
              role_type: role.role_type,
              permissions: role.permissions,
              assigned_at: role.assigned_at
            })) || [];
            
            // If no roles found, assign super_admin by default for admin users
            if (formattedRoles.length === 0 && sessionData.user_type === 'admin') {
              setAdminRoles([{
                role_type: 'super_admin',
                permissions: { all: true },
                assigned_at: new Date().toISOString()
              }]);
            } else {
              setAdminRoles(formattedRoles);
            }
          }
        } catch (roleError) {
          console.error('Role loading error:', roleError);
          // Fallback to default super admin role
          setAdminRoles([{
            role_type: 'super_admin',
            permissions: { all: true },
            assigned_at: new Date().toISOString()
          }]);
        }
      }
      
      console.log('User profile loaded successfully');
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      if (!sessionData?.college_id) return;

      // Load real data from database
      const [usersResult, coursesResult, eventsResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, is_active')
          .eq('college_id', sessionData.college_id),
        supabase
          .from('courses')
          .select('id, is_active')
          .eq('college_id', sessionData.college_id),
        supabase
          .from('events')
          .select('id, is_active')
          .eq('college_id', sessionData.college_id)
      ]);

      const totalUsers = usersResult.data?.length || 0;
      const activeUsers = usersResult.data?.filter(user => user.is_active)?.length || 0;
      const totalCourses = coursesResult.data?.filter(course => course.is_active)?.length || 0;
      const totalEvents = eventsResult.data?.filter(event => event.is_active)?.length || 0;

      setDashboardStats({
        totalUsers,
        activeUsers,
        totalCourses,
        totalEvents,
        monthlyRevenue: 0, // Will be calculated from fee_payments table
        pendingApprovals: 0 // Will be calculated from pending requests
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('colcord_user');
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin dashboard.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isSuperAdmin = (): boolean => {
    return adminRoles.some(role => role.role_type === 'super_admin') || 
           userProfile?.user_type === 'admin';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()}, {userProfile.first_name}!
              </h1>
              <p className="text-gray-600">
                Welcome to ColCord Admin Dashboard
                {sessionData && (
                  <span className="text-sm text-blue-600 block">
                    College: {sessionData.college_name || 'Unknown'}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {userProfile.hierarchy_level.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications ({dashboardStats.pendingApprovals})
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2">
            <TabsTrigger value="overview" className="flex items-center space-x-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="facilities" className="flex items-center space-x-1">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">Facilities</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Finance</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-1">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SmartDashboard />
          </TabsContent>

          <TabsContent value="users">
            <EnhancedUserManagement userProfile={userProfile} adminRoles={adminRoles} />
          </TabsContent>

          <TabsContent value="courses">
            <CourseManagement userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="facilities">
            <FacilityManagement userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="events">
            <EventManagement userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="finance">
            <FinanceManagement userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="logs">
            <AuditLogs userProfile={userProfile} adminRoles={adminRoles} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
