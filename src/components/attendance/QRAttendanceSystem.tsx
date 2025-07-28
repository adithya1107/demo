
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Scan, Users, Clock, MapPin, Calendar } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from '@/components/ui/use-toast';
import QRCodeGenerator from './QRCodeGenerator';
import QRCodeScanner from './QRCodeScanner';
import AttendanceAnalytics from './AttendanceAnalytics';

interface AttendanceSession {
  id: string;
  course_id: string;
  course_name: string;
  instructor_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  qr_code: string;
  location: string;
  total_students: number;
  present_students: number;
  is_active: boolean;
}

const QRAttendanceSystem = () => {
  const { profile } = useUserProfile();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scanner');

  useEffect(() => {
    loadAttendanceSessions();
  }, [profile]);

  const loadAttendanceSessions = async () => {
    if (!profile) return;

    try {
      // Mock data for now since attendance_sessions table doesn't exist in types
      const mockSessions: AttendanceSession[] = [
        {
          id: '1',
          course_id: '1',
          course_name: 'Mathematics 101',
          instructor_name: 'Dr. Smith',
          session_date: new Date().toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '10:30',
          qr_code: 'ATTEND_123456',
          location: 'Room 101',
          total_students: 30,
          present_students: 25,
          is_active: true
        },
        {
          id: '2',
          course_id: '2',
          course_name: 'Physics 201',
          instructor_name: 'Prof. Johnson',
          session_date: new Date().toISOString().split('T')[0],
          start_time: '11:00',
          end_time: '12:30',
          qr_code: 'ATTEND_789012',
          location: 'Lab 205',
          total_students: 25,
          present_students: 20,
          is_active: true
        }
      ];

      // Filter based on user type
      if (profile.user_type === 'faculty') {
        setActiveTab('generate');
      } else {
        setActiveTab('scanner');
      }

      setSessions(mockSessions);
      setActiveSessions(mockSessions.filter(s => s.is_active));
    } catch (error) {
      console.error('Error loading attendance sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance sessions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionCreated = () => {
    loadAttendanceSessions();
  };

  const handleAttendanceMarked = () => {
    loadAttendanceSessions();
    toast({
      title: 'Success',
      description: 'Attendance marked successfully!',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">QR Attendance System</h1>
          <p className="text-muted-foreground">
            {profile?.user_type === 'faculty' 
              ? 'Generate QR codes for your classes and track attendance' 
              : 'Scan QR codes to mark your attendance'
            }
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Classes</p>
                <p className="text-2xl font-bold">
                  {sessions.filter(s => 
                    new Date(s.session_date).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {sessions.filter(s => {
                    const sessionDate = new Date(s.session_date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return sessionDate >= weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">
            <Scan className="h-4 w-4 mr-2" />
            Scan QR
          </TabsTrigger>
          {profile?.user_type === 'faculty' && (
            <TabsTrigger value="generate">
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics">
            <Users className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeScanner
                onSuccess={handleAttendanceMarked}
                activeSessions={activeSessions}
              />
            </CardContent>
          </Card>

          {/* Active Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No active sessions at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{session.course_name}</h3>
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.instructor_name} • {session.start_time} - {session.end_time}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{session.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(session.session_date).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {profile?.user_type === 'faculty' && (
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Attendance Session</CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodeGenerator
                  onSessionCreated={handleSessionCreated}
                  instructorId={profile.id}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-4">
          <AttendanceAnalytics 
            sessions={sessions}
            userType={profile?.user_type || 'student'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QRAttendanceSystem;
