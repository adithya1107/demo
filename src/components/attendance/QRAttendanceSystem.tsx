
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Users, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import QRCodeGenerator from './QRCodeGenerator';
import QRCodeScanner from './QRCodeScanner';

const QRAttendanceSystem = () => {
  const { profile } = useUserProfile();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_type === 'faculty') {
      fetchFacultyCourses();
    } else if (profile?.user_type === 'student') {
      fetchStudentCourses();
    }
  }, [profile]);

  const fetchFacultyCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_name, course_code, instructor_id')
        .eq('instructor_id', profile?.id)
        .eq('is_active', true);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching faculty courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses (
            id,
            course_name,
            course_code,
            instructor_id
          )
        `)
        .eq('student_id', profile?.id)
        .eq('status', 'enrolled');

      if (error) throw error;
      
      const coursesData = data?.map(enrollment => ({
        id: enrollment.courses?.id,
        course_name: enrollment.courses?.course_name,
        course_code: enrollment.courses?.course_code,
        instructor_id: enrollment.courses?.instructor_id
      })) || [];
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching student courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enrolled courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSessions = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('session_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching attendance sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance sessions',
        variant: 'destructive'
      });
    }
  };

  const fetchAttendanceData = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          user_profiles (
            first_name,
            last_name,
            user_code
          )
        `)
        .eq('course_id', courseId)
        .order('marked_at', { ascending: false });

      if (error) throw error;
      setAttendanceData(data || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive'
      });
    }
  };

  const handleCourseSelect = (course: any) => {
    setSelectedCourse(course);
    fetchAttendanceSessions(course.id);
    fetchAttendanceData(course.id);
  };

  const createAttendanceSession = async () => {
    if (!selectedCourse || !profile) return;

    try {
      const sessionData = {
        course_id: selectedCourse.id,
        instructor_id: profile.id,
        session_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toTimeString().split(' ')[0],
        end_time: new Date(Date.now() + 60 * 60 * 1000).toTimeString().split(' ')[0], // 1 hour later
        topic: 'Regular Class',
        session_type: 'lecture',
        qr_code: `attendance_${selectedCourse.id}_${Date.now()}`,
        is_active: true
      };

      const { error } = await supabase
        .from('attendance_sessions')
        .insert(sessionData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance session created successfully'
      });

      fetchAttendanceSessions(selectedCourse.id);
      setShowQRGenerator(true);
    } catch (error) {
      console.error('Error creating attendance session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create attendance session',
        variant: 'destructive'
      });
    }
  };

  const handleQRScan = async (qrData: string) => {
    if (!profile || !selectedCourse) return;

    try {
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: profile.id,
          course_id: selectedCourse.id,
          class_date: new Date().toISOString().split('T')[0],
          status: 'present',
          marked_at: new Date().toISOString(),
          device_info: { qr_code: qrData }
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance marked successfully'
      });

      fetchAttendanceData(selectedCourse.id);
      setShowQRScanner(false);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive'
      });
    }
  };

  const getAttendanceStats = () => {
    if (!attendanceData.length) return { present: 0, absent: 0, total: 0 };

    const present = attendanceData.filter(record => record.status === 'present').length;
    const absent = attendanceData.filter(record => record.status === 'absent').length;
    const total = attendanceData.length;

    return { present, absent, total };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">QR Attendance System</h2>
          <p className="text-muted-foreground">
            {profile?.user_type === 'faculty' ? 'Manage attendance for your courses' : 'Mark your attendance'}
          </p>
        </div>
        
        {profile?.user_type === 'faculty' && selectedCourse && (
          <Button onClick={createAttendanceSession} className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Create Session
          </Button>
        )}
      </div>

      {/* Course Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <Card 
            key={course.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCourse?.id === course.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleCourseSelect(course)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{course.course_name}</h3>
                  <p className="text-sm text-muted-foreground">{course.course_code}</p>
                </div>
                <Badge variant="outline">{sessions.length} sessions</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCourse && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </CardContent>
            </Card>
          </div>

          {/* QR Code Actions */}
          <div className="flex gap-4">
            {profile?.user_type === 'faculty' && (
              <Dialog open={showQRGenerator} onOpenChange={setShowQRGenerator}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Show QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Attendance QR Code</DialogTitle>
                  </DialogHeader>
                  <QRCodeGenerator 
                    sessionId={sessions[0]?.id} 
                    courseId={selectedCourse.id}
                  />
                </DialogContent>
              </Dialog>
            )}

            {profile?.user_type === 'student' && (
              <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Scan QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Scan Attendance QR Code</DialogTitle>
                  </DialogHeader>
                  <QRCodeScanner onScan={handleQRScan} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Attendance Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{session.topic}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.session_date).toLocaleDateString()} • {session.start_time} - {session.end_time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.is_active ? "default" : "secondary"}>
                        {session.is_active ? "Active" : "Closed"}
                      </Badge>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default QRAttendanceSystem;
