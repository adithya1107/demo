
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface QRCodeGeneratorProps {
  onSessionCreated: () => void;
  instructorId: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ onSessionCreated, instructorId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    sessionDate: '',
    startTime: '',
    endTime: '',
    topic: '',
    location: ''
  });

  const [courses, setCourses] = useState<any[]>([]);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  React.useEffect(() => {
    loadInstructorCourses();
  }, [instructorId]);

  const loadInstructorCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_name, course_code')
        .eq('instructor_id', instructorId)
        .eq('is_active', true);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const generateQRCode = async () => {
    if (!formData.courseId || !formData.sessionDate || !formData.startTime || !formData.endTime) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Generate unique QR code
      const qrCode = `ATTEND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert({
          course_id: formData.courseId,
          instructor_id: instructorId,
          session_date: formData.sessionDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          topic: formData.topic,
          room_location: formData.location,
          qr_code: qrCode,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setGeneratedQR(qrCode);
      onSessionCreated();
      
      toast({
        title: 'Success',
        description: 'QR code generated successfully!'
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      sessionDate: '',
      startTime: '',
      endTime: '',
      topic: '',
      location: ''
    });
    setGeneratedQR(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Generate QR Code</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="course">Course</Label>
              <Select value={formData.courseId} onValueChange={(value) => setFormData({...formData, courseId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Session Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({...formData, sessionDate: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="topic">Topic (Optional)</Label>
              <Input
                id="topic"
                placeholder="Enter session topic"
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Room/Location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button onClick={generateQRCode} disabled={loading}>
              {loading ? 'Generating...' : 'Generate QR Code'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedQR && (
        <Card>
          <CardHeader>
            <CardTitle>Generated QR Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-white p-8 rounded-lg inline-block mb-4">
              <div className="text-4xl font-mono break-all">{generatedQR}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Students can scan this QR code to mark their attendance
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRCodeGenerator;
