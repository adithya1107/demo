
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scan, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';

interface QRCodeScannerProps {
  onSuccess: () => void;
  activeSessions: any[];
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onSuccess, activeSessions }) => {
  const { profile } = useUserProfile();
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);

  const markAttendance = async () => {
    if (!qrCode.trim()) {
      toast({
        title: 'Missing QR Code',
        description: 'Please enter or scan a QR code',
        variant: 'destructive'
      });
      return;
    }

    if (!profile) {
      toast({
        title: 'Error',
        description: 'User profile not found',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Find the session with this QR code
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('qr_code', qrCode)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        toast({
          title: 'Invalid QR Code',
          description: 'QR code not found or session is inactive',
          variant: 'destructive'
        });
        return;
      }

      // Check if student is enrolled in the course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', session.course_id)
        .eq('student_id', profile.id)
        .single();

      if (enrollmentError || !enrollment) {
        toast({
          title: 'Not Enrolled',
          description: 'You are not enrolled in this course',
          variant: 'destructive'
        });
        return;
      }

      // Check if attendance already marked
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', session.id)
        .eq('student_id', profile.id)
        .single();

      if (existingAttendance) {
        toast({
          title: 'Already Marked',
          description: 'Your attendance has already been marked for this session',
          variant: 'destructive'
        });
        return;
      }

      // Mark attendance
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          session_id: session.id,
          student_id: profile.id,
          course_id: session.course_id,
          class_date: session.session_date,
          status: 'present',
          marked_at: new Date().toISOString(),
          location_verified: true
        });

      if (attendanceError) throw attendanceError;

      toast({
        title: 'Success',
        description: 'Attendance marked successfully!'
      });

      setQrCode('');
      onSuccess();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateQRScan = () => {
    // For demo purposes, use the first active session's QR code
    if (activeSessions.length > 0) {
      const firstSession = activeSessions[0];
      // Generate a mock QR code for demo
      const mockQR = `ATTEND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setQrCode(mockQR);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scan className="h-5 w-5" />
            <span>Scan QR Code</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="qrCode">QR Code</Label>
            <Input
              id="qrCode"
              placeholder="Enter QR code or scan using camera"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
            />
          </div>

          <div className="flex space-x-4">
            <Button onClick={markAttendance} disabled={loading || !qrCode.trim()}>
              {loading ? 'Marking...' : 'Mark Attendance'}
            </Button>
            <Button variant="outline" onClick={simulateQRScan}>
              Simulate Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Ask your instructor to generate a QR code for the class</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Scan the QR code or enter it manually</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Your attendance will be marked automatically</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeScanner;
