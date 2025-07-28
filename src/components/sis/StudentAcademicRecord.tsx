import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { apiGateway } from '@/utils/apiGateway';
import { useUserProfile } from '@/hooks/useUserProfile';
import { GraduationCap, BookOpen, Award, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AcademicRecord {
  id: string;
  academic_year: string;
  semester: string;
  cgpa: number;
  sgpa: number;
  total_credits: number;
  completed_credits: number;
  academic_status: string;
}

interface CourseGrade {
  course_name: string;
  course_code: string;
  credits: number;
  grade: string;
  marks: number;
}

const StudentAcademicRecord: React.FC = () => {
  const { profile } = useUserProfile();
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchAcademicRecords();
      fetchCourseGrades();
    }
  }, [profile?.id]);

  const fetchAcademicRecords = async () => {
    try {
      // Changed from 'student_academic_records' to 'academic_records' or another valid table name
      // You may need to adjust this based on your actual table name
      const response = await apiGateway.select('academic_records', {
        filters: { student_id: profile?.id },
        order: { column: 'academic_year', ascending: false }
      });

      if (response.success && response.data) {
        setAcademicRecords(response.data);
      }
    } catch (error) {
      console.error('Error fetching academic records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch academic records',
        variant: 'destructive'
      });
    }
  };

  const fetchCourseGrades = async () => {
    try {
      const response = await apiGateway.select('enrollments', {
        select: `
          grade,
          courses (
            course_name,
            course_code,
            credits
          )
        `,
        filters: { student_id: profile?.id },
        order: { column: 'created_at', ascending: false }
      });

      if (response.success && response.data) {
        const grades: CourseGrade[] = response.data
          .filter(enrollment => enrollment.grade)
          .map(enrollment => ({
            course_name: enrollment.courses.course_name,
            course_code: enrollment.courses.course_code,
            credits: enrollment.courses.credits,
            grade: enrollment.grade,
            marks: calculateMarksFromGrade(enrollment.grade)
          }));

        setCourseGrades(grades);
      }
    } catch (error) {
      console.error('Error fetching course grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMarksFromGrade = (grade: string): number => {
    const gradeMap: { [key: string]: number } = {
      'A+': 95, 'A': 90, 'A-': 85,
      'B+': 80, 'B': 75, 'B-': 70,
      'C+': 65, 'C': 60, 'C-': 55,
      'D': 50, 'F': 0
    };
    return gradeMap[grade] || 0;
  };

  const getGradeColor = (grade: string): string => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'bg-green-100 text-green-800';
    if (['B+', 'B', 'B-'].includes(grade)) return 'bg-blue-100 text-blue-800';
    if (['C+', 'C', 'C-'].includes(grade)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const currentRecord = academicRecords[0];
  const completionPercentage = currentRecord 
    ? (currentRecord.completed_credits / currentRecord.total_credits) * 100
    : 0;

  if (loading) {
    return <div className="flex justify-center py-8">Loading academic records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Academic Record</h2>
        <Badge variant="outline" className="text-sm">
          {currentRecord?.academic_status || 'Active'}
        </Badge>
      </div>

      {currentRecord && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current CGPA</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentRecord.cgpa?.toFixed(2) || 'N/A'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current SGPA</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentRecord.sgpa?.toFixed(2) || 'N/A'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentRecord.completed_credits}/{currentRecord.total_credits}
              </div>
              <Progress value={completionPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Academic Year</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{currentRecord.academic_year}</div>
              <div className="text-sm text-muted-foreground">{currentRecord.semester}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Course Grades</TabsTrigger>
          <TabsTrigger value="history">Academic History</TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Grades</CardTitle>
            </CardHeader>
            <CardContent>
              {courseGrades.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No grades available yet
                </p>
              ) : (
                <div className="space-y-4">
                  {courseGrades.map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{course.course_name}</h4>
                        <p className="text-sm text-muted-foreground">{course.course_code}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Credits</div>
                          <div className="font-medium">{course.credits}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Marks</div>
                          <div className="font-medium">{course.marks}%</div>
                        </div>
                        <Badge className={getGradeColor(course.grade)}>
                          {course.grade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic History</CardTitle>
            </CardHeader>
            <CardContent>
              {academicRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No academic history available
                </p>
              ) : (
                <div className="space-y-4">
                  {academicRecords.map((record) => (
                    <div key={record.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{record.academic_year}</h4>
                          <p className="text-sm text-muted-foreground">{record.semester}</p>
                        </div>
                        <Badge variant="outline">{record.academic_status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">CGPA:</span>
                          <span className="ml-2 font-medium">{record.cgpa?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">SGPA:</span>
                          <span className="ml-2 font-medium">{record.sgpa?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Credits:</span>
                          <span className="ml-2 font-medium">
                            {record.completed_credits}/{record.total_credits}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="ml-2 font-medium">
                            {Math.round((record.completed_credits / record.total_credits) * 100)}%
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
      </Tabs>
    </div>
  );
};

export default StudentAcademicRecord;
