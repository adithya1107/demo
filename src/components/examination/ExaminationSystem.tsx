import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { FileText, Clock, MapPin, Download, Award, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Examination {
  id: string;
  course_id: string;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  room_id: string;
  instructions: string;
  is_active: boolean;
  courses: {
    course_name: string;
    course_code: string;
  };
  rooms: {
    room_number: string;
    building: string;
  };
}

interface ExamEnrollment {
  id: string;
  exam_id: string;
  student_id: string;
  hall_ticket_number: string;
  seat_number: string;
  is_present: boolean;
  marks_obtained: number;
  grade: string;
  status: string;
}

interface HallTicket {
  id: string;
  student_id: string;
  exam_id: string;
  hall_ticket_number: string;
  seat_number: string;
  room_id: string;
  special_instructions: string;
  is_valid: boolean;
  generated_at: string;
  examination: Examination;
}

const ExaminationSystem: React.FC = () => {
  const { profile } = useUserProfile();
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [enrollments, setEnrollments] = useState<ExamEnrollment[]>([]);
  const [hallTickets, setHallTickets] = useState<HallTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchExaminations();
      fetchExamEnrollments();
      fetchHallTickets();
    }
  }, [profile?.id]);

  const fetchExaminations = async () => {
    try {
      let query = supabase
        .from('examinations' as any) // Type assertion to bypass TypeScript error
        .select(`
          *,
          courses (
            course_name,
            course_code
          ),
          rooms (
            room_number,
            building
          )
        `)
        .eq('is_active', true);

      if (profile?.user_type === 'student') {
        // Get enrolled courses for student
        const { data: courseEnrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', profile.id);

        if (courseEnrollments && courseEnrollments.length > 0) {
          const courseIds = courseEnrollments.map(e => e.course_id);
          query = query.in('course_id', courseIds);
        }
      } else if (profile?.user_type === 'faculty') {
        // Get courses taught by faculty
        const { data: courses } = await supabase
          .from('courses')
          .select('id')
          .eq('instructor_id', profile.id);

        if (courses && courses.length > 0) {
          const courseIds = courses.map(c => c.id);
          query = query.in('course_id', courseIds);
        }
      }

      const { data, error } = await query.order('exam_date', { ascending: true });

      if (error) throw error;
      setExaminations((data as any) || []); // Type assertion
    } catch (error) {
      console.error('Error fetching examinations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch examinations',
        variant: 'destructive'
      });
    }
  };

  const fetchExamEnrollments = async () => {
    try {
      if (profile?.user_type === 'student') {
        const { data, error } = await supabase
          .from('exam_enrollments' as any) // Type assertion
          .select('*')
          .eq('student_id', profile.id);

        if (error) throw error;
        setEnrollments((data as unknown as ExamEnrollment[]) || []); // Convert through unknown
      }
    } catch (error) {
      console.error('Error fetching exam enrollments:', error);
    }
  };

  const fetchHallTickets = async () => {
    try {
      if (profile?.user_type === 'student') {
        const { data, error } = await supabase
          .from('hall_tickets' as any) // Type assertion
          .select(`
            *,
            examination:examinations (
              exam_name,
              exam_date,
              start_time,
              end_time,
              courses (
                course_name,
                course_code
              ),
              rooms (
                room_number,
                building
              )
            )
          `)
          .eq('student_id', profile.id)
          .eq('is_valid', true);

        if (error) throw error;
        setHallTickets((data as unknown as HallTicket[]) || []); // Convert through unknown
      }
    } catch (error) {
      console.error('Error fetching hall tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case 'final':
        return 'bg-red-100 text-red-800';
      case 'midterm':
        return 'bg-orange-100 text-orange-800';
      case 'quiz':
        return 'bg-blue-100 text-blue-800';
      case 'assignment':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExamStatus = (examDate: string, startTime: string): string => {
    const now = new Date();
    const examDateTime = new Date(`${examDate}T${startTime}`);
    
    if (examDateTime > now) {
      return 'upcoming';
    } else if (examDateTime < now) {
      return 'completed';
    } else {
      return 'ongoing';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnrollmentForExam = (examId: string): ExamEnrollment | null => {
    return enrollments.find(e => e.exam_id === examId) || null;
  };

  const getHallTicketForExam = (examId: string): HallTicket | null => {
    return hallTickets.find(h => h.exam_id === examId) || null;
  };

  const generateHallTicket = async (examId: string) => {
    try {
      const hallTicketNumber = `HT${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
      
      const { error } = await supabase
        .from('hall_tickets' as any) // Type assertion
        .insert({
          student_id: profile?.id,
          exam_id: examId,
          hall_ticket_number: hallTicketNumber,
          seat_number: `S${Math.floor(Math.random() * 100) + 1}`,
          is_valid: true,
          generated_by: profile?.id
        });

      if (error) throw error;
      
      await fetchHallTickets();
      
      toast({
        title: 'Hall Ticket Generated',
        description: `Your hall ticket ${hallTicketNumber} has been generated successfully`,
      });
    } catch (error) {
      console.error('Error generating hall ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate hall ticket',
        variant: 'destructive'
      });
    }
  };

  const downloadHallTicket = (hallTicket: HallTicket) => {
    // Create a simple hall ticket content
    const content = `
      HALL TICKET
      
      Hall Ticket Number: ${hallTicket.hall_ticket_number}
      Student Name: ${profile?.first_name} ${profile?.last_name}
      
      Examination Details:
      Subject: ${hallTicket.examination.courses.course_name}
      Course Code: ${hallTicket.examination.courses.course_code}
      Date: ${new Date(hallTicket.examination.exam_date).toLocaleDateString()}
      Time: ${hallTicket.examination.start_time} - ${hallTicket.examination.end_time}
      
      Venue: ${hallTicket.examination.rooms.room_number}, ${hallTicket.examination.rooms.building}
      Seat Number: ${hallTicket.seat_number}
      
      Instructions:
      ${hallTicket.special_instructions || 'Follow all examination rules and regulations.'}
      
      Generated on: ${new Date(hallTicket.generated_at).toLocaleString()}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hall_ticket_${hallTicket.hall_ticket_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading examination system...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Examination System</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {profile?.user_type === 'student' ? 'Student View' : 'Faculty View'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="examinations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="examinations">Examinations</TabsTrigger>
          {profile?.user_type === 'student' && (
            <>
              <TabsTrigger value="hall-tickets">Hall Tickets</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="examinations" className="space-y-4">
          {examinations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No examinations scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {examinations.map((exam) => {
                const enrollment = getEnrollmentForExam(exam.id);
                const hallTicket = getHallTicketForExam(exam.id);
                const status = getExamStatus(exam.exam_date, exam.start_time);
                
                return (
                  <Card key={exam.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{exam.exam_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {exam.courses.course_code} - {exam.courses.course_name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getExamTypeColor(exam.exam_type)}>
                            {exam.exam_type}
                          </Badge>
                          <Badge className={getStatusColor(status)}>
                            {status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(exam.exam_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(exam.start_time)} - {formatTime(exam.end_time)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {exam.rooms.room_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {exam.rooms.building}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {exam.duration_minutes} minutes
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {exam.total_marks} marks
                            </div>
                          </div>
                        </div>
                        
                        {enrollment && (
                          <div className="flex items-center space-x-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">
                                {enrollment.grade || 'Not graded'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {enrollment.marks_obtained || 0}/{exam.total_marks}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {exam.instructions && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Instructions:</h4>
                          <p className="text-sm text-muted-foreground">{exam.instructions}</p>
                        </div>
                      )}
                      
                      {profile?.user_type === 'student' && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {hallTicket ? (
                              <div className="flex items-center space-x-2 text-green-600">
                                <Award className="h-4 w-4" />
                                <span className="text-sm">Hall Ticket Generated</span>
                              </div>
                            ) : status === 'upcoming' ? (
                              <div className="flex items-center space-x-2 text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Hall Ticket Pending</span>
                              </div>
                            ) : null}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {hallTicket ? (
                              <Button
                                size="sm"
                                onClick={() => downloadHallTicket(hallTicket)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download Hall Ticket
                              </Button>
                            ) : status === 'upcoming' ? (
                              <Button
                                size="sm"
                                onClick={() => generateHallTicket(exam.id)}
                              >
                                Generate Hall Ticket
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {profile?.user_type === 'student' && (
          <TabsContent value="hall-tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hall Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {hallTickets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hall tickets generated yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {hallTickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{ticket.examination.exam_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {ticket.examination.courses.course_code} - {ticket.examination.courses.course_name}
                            </p>
                          </div>
                          <Badge variant="outline">{ticket.hall_ticket_number}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-sm font-medium">Exam Date</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(ticket.examination.exam_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Time</div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(ticket.examination.start_time)} - {formatTime(ticket.examination.end_time)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Seat</div>
                            <div className="text-sm text-muted-foreground">
                              {ticket.seat_number} - {ticket.examination.rooms.room_number}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => downloadHallTicket(ticket)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {profile?.user_type === 'student' && (
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Examination Results</CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No examination results available
                  </p>
                ) : (
                  <div className="space-y-4">
                    {enrollments.map((enrollment) => {
                      const exam = examinations.find(e => e.id === enrollment.exam_id);
                      if (!exam) return null;
                      
                      const percentage = exam.total_marks > 0 
                        ? (enrollment.marks_obtained / exam.total_marks) * 100 
                        : 0;
                      
                      return (
                        <div key={enrollment.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{exam.exam_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {exam.courses.course_code} - {exam.courses.course_name}
                              </p>
                            </div>
                            <div className="text-right">
                              {enrollment.grade && (
                                <Badge variant="outline" className="mb-1">
                                  {enrollment.grade}
                                </Badge>
                              )}
                              <div className="text-sm text-muted-foreground">
                                {enrollment.status}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Score</span>
                              <span className="text-sm font-medium">
                                {enrollment.marks_obtained || 0}/{exam.total_marks}
                              </span>
                            </div>
                            <Progress value={percentage} />
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span>Percentage: {percentage.toFixed(1)}%</span>
                              <span>
                                Date: {new Date(exam.exam_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ExaminationSystem;