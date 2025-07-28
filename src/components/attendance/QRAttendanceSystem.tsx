
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from '@/components/ui/use-toast';
import { QRCodeGenerator } from './QRCodeGenerator';
import { QRCodeScanner } from './QRCodeScanner';
import { Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';

interface AttendanceSession {
  id: string;
  course_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  topic: string;
  qr_code: string;
  is_active: boolean;
  course_name?: string;
  instructor_name?: string;
  room_location?: string;
}

const QRAttendanceSystem = () => {
  const { profile } = useUserProfile();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [profile]);

  const loadSessions = async () => {
    if (!profile?.id) return;

    try {
      if (profile.user_type === 'faculty') {
        // Load sessions for faculty
        const { data: sessionsData, error } = await supabase
          .from('attendance_sessions')
          .select(`
            *,
            courses:course_id (
              course_name,
              instructor_id
            )
          `)
          .eq('instructor_id', profile.id)
          .order('session_date', { ascending: false });

        if (error) throw error;

        const formattedSessions = (sessionsData || []).map(session => ({
          ...session,
          course_name: session.courses?.course_name || 'Unknown Course',
          instructor_name: `${profile.first_name} ${profile.last_name}`
        }));

        setSessions(formattedSessions);
      } else if (profile.user_type === 'student') {
        // Load sessions for enrolled courses
        const { data: enrollmentsData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select(`
            course_id,
            courses:course_id (
              id,
              course_name,
              instructor_id,
              user_profiles:instructor_id (
                first_name,
                last_name
              )
            )
          `)
          .eq('student_id', profile.id)
          .eq('status', 'enrolled');

        if (enrollmentError) throw enrollmentError;

        const courseIds = enrollmentsData?.map(e => e.course_id) || [];
        
        if (courseIds.length > 0) {
          const { data: sessionsData, error } = await supabase
            .from('attendance_sessions')
            .select('*')
            .in('course_id', courseIds)
            .order('session_date', { ascending: false });

          if (error) throw error;

          const formattedSessions = (sessionsData || []).map(session => {
            const courseInfo = enrollmentsData?.find(e => e.course_id === session.course_id);
            return {
              ...session,
              course_name: courseInfo?.courses?.course_name || 'Unknown Course',
              instructor_name: courseInfo?.courses?.user_profiles 
                ? `${courseInfo.courses.user_profiles.first_name} ${courseInfo.courses.user_profiles.last_name}`
                : 'Unknown Instructor'
            };
          });

          setSessions(formattedSessions);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance sessions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (sessionData: any) => {
    if (!profile?.id) return;

    try {
      const qrCode = `${sessionData.course_id}-${Date.now()}`;
      
      const { error } = await supabase
        .from('attendance_sessions')
        .insert({
          course_id: sessionData.course_id,
          instructor_id: profile.id,
          session_date: sessionData.date,
          start_time: sessionData.start_time,
          end_time: sessionData.end_time,
          topic: sessionData.topic,
          qr_code: qrCode,
          room_location: sessionData.room_location,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance session created successfully',
      });

      loadSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create attendance session',
        variant: 'destructive'
      });
    }
  };

  const handleScanSuccess = async (qrCode: string) => {
    if (!profile?.id) return;

    try {
      // Find the session by QR code
      const session = sessions.find(s => s.qr_code === qrCode);
      if (!session) {
        toast({
          title: 'Error',
          description: 'Invalid QR code or session not found',
          variant: 'destructive'
        });
        return;
      }

      // Check if already marked attendance
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', profile.id)
        .eq('session_id', session.id)
        .single();

      if (existingAttendance) {
        toast({
          title: 'Already Marked',
          description: 'Your attendance has already been recorded for this session',
          variant: 'destructive'
        });
        return;
      }

      // Mark attendance
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: profile.id,
          course_id: session.course_id,
          session_id: session.id,
          class_date: session.session_date,
          status: 'present',
          marked_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance marked successfully!',
      });

    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive'
      });
    }
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
              ? 'Manage attendance sessions and generate QR codes' 
              : 'Scan QR codes to mark your attendance'
            }
          </p>
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          {profile?.user_type === 'faculty' && (
            <TabsTrigger value="generate">Generate QR</TabsTrigger>
          )}
          {profile?.user_type === 'student' && (
            <TabsTrigger value="scan">Scan QR</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{session.course_name}</h3>
                      <p className="text-sm text-muted-foreground">{session.topic}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(session.session_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{session.start_time} - {session.end_time}</span>
                        </div>
                        {session.room_location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{session.room_location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={session.is_active ? "default" : "secondary"}>
                        {session.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {profile?.user_type === 'faculty' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                          variant="outline"
                        >
                          View QR
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {profile?.user_type === 'faculty' && (
          <TabsContent value="generate" className="space-y-4">
            <QRCodeGenerator 
              onSessionCreated={handleCreateSession}
              selectedSession={selectedSession}
            />
          </TabsContent>
        )}

        {profile?.user_type === 'student' && (
          <TabsContent value="scan" className="space-y-4">
            <QRCodeScanner onScanSuccess={handleScanSuccess} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default QRAttendanceSystem;
