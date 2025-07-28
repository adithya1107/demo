
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  HelpCircle,
  GraduationCap,
  Clock,
  FileText,
  Bell,
  Moon,
  Sun,
  Settings,
  User,
  Menu,
  X,
  Users,
  Award,
  PlayCircle,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import EnhancedSidebarNavigation from '@/components/layout/EnhancedSidebarNavigation';
import SearchBar from '@/components/layout/SearchBar';
import BreadcrumbNavigation from '@/components/ui/breadcrumb-navigation';
import TeacherDashboard from '@/components/teacher/TeacherDashboard';
import TeacherSchedule from '@/components/teacher/TeacherSchedule';
import TeacherCourses from '@/components/teacher/TeacherCourses';
import TeacherGradebook from '@/components/teacher/TeacherGradebook';
import TeacherCalendarAttendance from '@/components/teacher/TeacherCalendarAttendance';
import TeacherEvents from '@/components/teacher/TeacherEvents';
import TeacherCommunication from '@/components/teacher/TeacherCommunication';
import TeacherSupport from '@/components/teacher/TeacherSupport';
import UserProfile from '@/components/UserProfile';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import LearningManagementSystem from '@/components/lms/LearningManagementSystem';
import TimetableManagement from '@/components/timetable/TimetableManagement';
import ExaminationSystem from '@/components/examination/ExaminationSystem';
import CommunicationHub from '@/components/communication/CommunicationHub';

const Teacher = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [teacherData, setTeacherData] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const loadTeacherData = async () => {
      setIsLoading(true);
      try {
        const userData = localStorage.getItem('colcord_user');
        if (userData) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setTeacherData(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teacher data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTeacherData();
  }, []);

  const handleNotifications = () => {
    toast({
      title: 'Notifications',
      description: 'No new notifications at the moment.',
    });
  };

  const handleSettings = () => {
    toast({
      title: 'Settings',
      description: 'Settings panel will be available soon.',
    });
  };

  const handleUserProfile = () => {
    setShowProfile(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('colcord_user');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    window.location.href = '/';
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  const handleSearchResultSelect = (result: any) => {
    console.log('Selected result:', result);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="bg-background/95 backdrop-blur-sm border-b border-white/10 h-16"></div>
          <div className="flex">
            <div className="w-64 border-r border-white/10 h-screen"></div>
            <div className="flex-1 p-6">
              <LoadingSkeleton variant="dashboard" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!teacherData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to access the teacher portal.</p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const sidebarGroups = [
    {
      id: 'main',
      label: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: GraduationCap, badge: teacherData.notifications?.length || 0 },
        { id: 'timetable', label: 'Timetable', icon: Clock },
        { id: 'schedule', label: 'Schedule', icon: Calendar },
        { id: 'attendance', label: 'Attendance', icon: BarChart3 },
      ]
    },
    {
      id: 'academic',
      label: 'Academic',
      items: [
        { id: 'courses', label: 'My Courses', icon: BookOpen, badge: 4 },
        { id: 'lms', label: 'Learning Portal', icon: PlayCircle },
        { id: 'gradebook', label: 'Gradebook', icon: FileText },
        { id: 'examinations', label: 'Examinations', icon: ClipboardList },
        { id: 'events', label: 'Events', icon: Bell },
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      items: [
        { id: 'communication-hub', label: 'Communication Hub', icon: MessageSquare },
        { id: 'communication', label: 'Legacy Chat', icon: Users },
      ]
    },
    {
      id: 'services',
      label: 'Services',
      collapsible: true,
      defaultExpanded: false,
      items: [
        { id: 'support', label: 'Support', icon: HelpCircle },
      ]
    }
  ];

  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <TeacherDashboard teacherData={teacherData} />;
      case 'timetable':
        return <TimetableManagement />;
      case 'schedule':
        return <TeacherSchedule teacherData={teacherData} />;
      case 'courses':
        return <TeacherCourses teacherData={teacherData} />;
      case 'lms':
        return <LearningManagementSystem />;
      case 'gradebook':
        return <TeacherGradebook teacherData={teacherData} />;
      case 'examinations':
        return <ExaminationSystem />;
      case 'attendance':
        return <TeacherCalendarAttendance teacherData={teacherData} />;
      case 'events':
        return <TeacherEvents teacherData={teacherData} />;
      case 'communication-hub':
        return <CommunicationHub />;
      case 'communication':
        return <TeacherCommunication teacherData={teacherData} />;
      case 'support':
        return <TeacherSupport teacherData={teacherData} />;
      default:
        return <TeacherDashboard teacherData={teacherData} />;
    }
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      timetable: 'Timetable & Schedule',
      schedule: 'Schedule',
      courses: 'My Courses',
      lms: 'Learning Management System',
      gradebook: 'Gradebook',
      examinations: 'Examinations',
      attendance: 'Attendance Management',
      events: 'Events & Calendar',
      'communication-hub': 'Communication Hub',
      communication: 'Communication Center',
      support: 'Support & Help'
    };
    return titles[activeView as keyof typeof titles] || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-background/95 backdrop-blur-sm border-b border-white/10">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
              >
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Button>
              
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-foreground">ColCord</h1>
                <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-role-teacher rounded-full animate-pulse-indicator"></div>
                  <span className="text-lg font-medium text-foreground hidden sm:inline">Teacher Portal</span>
                </div>
              </div>
            </div>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:block">
              <SearchBar 
                onSearch={handleSearch}
                onResultSelect={handleSearchResultSelect}
                className="w-80"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleNotifications}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors relative"
              >
                <Bell className="h-5 w-5 text-foreground" />
                {teacherData.notifications?.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-role-admin text-white text-xs rounded-full flex items-center justify-center">
                    {teacherData.notifications.length}
                  </span>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors hidden sm:flex"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSettings}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors hidden sm:flex"
              >
                <Settings className="h-5 w-5 text-foreground" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleUserProfile}
                className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
              >
                <User className="h-5 w-5 text-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'hidden lg:block' : 'block'} transition-all duration-300`}>
          <EnhancedSidebarNavigation
            groups={sidebarGroups}
            activeItem={activeView}
            onItemClick={handleViewChange}
            userType="teacher"
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Breadcrumb and Page Title */}
          <div className="bg-background/50 backdrop-blur-sm border-b border-white/5 p-4">
            <div className="space-y-2">
              <BreadcrumbNavigation />
              <h2 className="text-2xl font-bold text-foreground">{getPageTitle()}</h2>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Mobile Search - Show on small screens */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <SearchBar 
          onSearch={handleSearch}
          onResultSelect={handleSearchResultSelect}
          placeholder="Search..."
        />
      </div>

      {/* User Profile Modal */}
      <UserProfile
        user={teacherData}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
};

export default Teacher;
