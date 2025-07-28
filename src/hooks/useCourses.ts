
import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { apiGateway } from '@/utils/apiGateway';

export interface Course {
  id: string;
  course_name: string;
  course_code: string;
  description: string | null;
  credits: number;
  instructor_id: string | null;
  college_id: string;
  academic_year: string | null;
  semester: string | null;
  max_students: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseWithDetails extends Course {
  instructor_name?: string;
  enrolled_students?: number;
  assignments_count?: number;
  is_enrolled?: boolean;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string;
  max_marks: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useCourses = () => {
  const { profile } = useUserProfile();
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchCourses();
    }
  }, [profile?.id]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      const response = await apiGateway.select('courses', {
        filters: { college_id: profile?.college_id, is_active: true },
        order: { column: 'course_name', ascending: true }
      });

      if (response.success && response.data) {
        const coursesData = response.data as Course[];
        
        // Fetch additional details for each course
        const coursesWithDetails = await Promise.all(
          coursesData.map(async (course) => {
            const [instructorResponse, enrollmentResponse, assignmentResponse] = await Promise.all([
              // Fetch instructor details
              course.instructor_id ? apiGateway.select('user_profiles', {
                filters: { id: course.instructor_id },
                limit: 1
              }) : Promise.resolve({ success: true, data: [] }),
              
              // Fetch enrollment count
              apiGateway.select('enrollments', {
                filters: { course_id: course.id, status: 'enrolled' }
              }),
              
              // Fetch assignments count
              apiGateway.select('assignments', {
                filters: { course_id: course.id }
              })
            ]);

            const instructor = instructorResponse.data?.[0];
            const enrollments = enrollmentResponse.data || [];
            const courseAssignments = assignmentResponse.data || [];

            // Check if current user is enrolled
            const isEnrolled = profile?.user_type === 'student' && 
              enrollments.some((e: any) => e.student_id === profile.id);

            return {
              ...course,
              instructor_name: instructor ? `${instructor.first_name} ${instructor.last_name}` : 'TBA',
              enrolled_students: enrollments.length,
              assignments_count: courseAssignments.length,
              is_enrolled: isEnrolled
            };
          })
        );

        setCourses(coursesWithDetails);
      } else {
        setError(response.error || 'Failed to fetch courses');
      }
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (courseId?: string) => {
    try {
      const filters: any = {};
      
      if (courseId) {
        filters.course_id = courseId;
      } else if (profile?.user_type === 'student') {
        // Fetch assignments for enrolled courses
        const enrollmentResponse = await apiGateway.select('enrollments', {
          filters: { student_id: profile.id, status: 'enrolled' }
        });
        
        if (enrollmentResponse.success && enrollmentResponse.data) {
          const courseIds = enrollmentResponse.data.map((e: any) => e.course_id);
          // This would need a proper IN query implementation
          // For now, we'll fetch all assignments and filter client-side
        }
      }

      const response = await apiGateway.select('assignments', {
        filters,
        order: { column: 'due_date', ascending: true }
      });

      if (response.success && response.data) {
        setAssignments(response.data as Assignment[]);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!profile?.id || profile.user_type !== 'student') {
      return { success: false, error: 'Only students can enroll in courses' };
    }

    try {
      const response = await apiGateway.insert('enrollments', {
        student_id: profile.id,
        course_id: courseId,
        status: 'enrolled',
        enrollment_date: new Date().toISOString()
      });

      if (response.success) {
        await fetchCourses(); // Refresh courses
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to enroll in course' };
    }
  };

  const createCourse = async (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await apiGateway.insert('courses', courseData);
      
      if (response.success) {
        await fetchCourses(); // Refresh courses
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to create course' };
    }
  };

  const createAssignment = async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await apiGateway.insert('assignments', assignmentData);
      
      if (response.success) {
        await fetchAssignments(); // Refresh assignments
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to create assignment' };
    }
  };

  return {
    courses,
    assignments,
    loading,
    error,
    enrollInCourse,
    createCourse,
    createAssignment,
    fetchAssignments,
    refetch: fetchCourses
  };
};
