// src/components/student/MyCourses.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CourseCard from './courses/CourseCard';
import CourseDetailsDialog from './courses/CourseDetailsDialog';
import { useUserProfile } from '@/hooks/useUserProfile';

interface MyCoursesProps {
  studentData?: {
    user_id: string;
    [key: string]: any;
  };
}

const MyCourses: React.FC<MyCoursesProps> = ({ studentData }) => {
  const { profile } = useUserProfile();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [lectureMaterials, setLectureMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Determine current student ID
  const currentStudentId = studentData?.user_id || profile?.id;

  useEffect(() => {
    if (currentStudentId) {
      fetchEnrolledCourses();
    }
  }, [currentStudentId]);

  const fetchEnrolledCourses = async () => {
    try {
      const { data: enrollmentsData, error } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', currentStudentId);

      if (error) throw error;
      setCourses(enrollmentsData?.map(e => e.courses) || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch enrolled courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    try {
      // Lecture materials
      const { data: materialsData } = await supabase
        .from('lecture_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('uploaded_at', { ascending: false });
      setLectureMaterials(materialsData || []);

      // Assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date');
      setAssignments(assignmentsData || []);

      // Submissions
      const { data: submissionsData } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', currentStudentId)
        .in('assignment_id', assignmentsData?.map(a => a.id) || []);
      setSubmissions(submissionsData || []);

      // Grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', currentStudentId)
        .eq('course_id', courseId)
        .order('recorded_at', { ascending: false });
      setGrades(gradesData || []);

      // Certificates
      const { data: certificatesData } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', currentStudentId)
        .eq('course_id', courseId);
      setCertificates(certificatesData || []);
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const handleViewCourseDetails = (course: any) => {
    setSelectedCourse(course);
    fetchCourseDetails(course.id);
  };

  const handleSubmitAssignment = async (
    assignmentId: string,
    submissionText: string,
    fileUrl?: string
  ) => {
    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: currentStudentId,
          submission_text: submissionText,
          file_url: fileUrl,
          submitted_at: new Date().toISOString(),
        });
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment submitted successfully',
      });

      // Refresh course details (including submissions)
      if (selectedCourse) {
        fetchCourseDetails(selectedCourse.id);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <p className="text-gray-600">{courses.length} enrolled courses</p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No courses enrolled yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onViewDetails={handleViewCourseDetails}
            />
          ))}
        </div>
      )}

      {/* Pass props to CourseDetailsDialog */}
      <CourseDetailsDialog
        {...({
          course: selectedCourse,
          isOpen: !!selectedCourse,
          onClose: () => setSelectedCourse(null),
          lectureMaterials,
          assignments,
          submissions,
          grades,
          certificates,
          onSubmitAssignment: handleSubmitAssignment,
        } as any)}
      />
    </div>
  );
};

export default MyCourses;
