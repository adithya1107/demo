
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
    let mounted = true;

    const fetchCourses = async () => {
      if (!profile?.college_id) {
        if (mounted) {
          setCourses([]);
          setAssignments([]);
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        
        const response = await apiGateway.select('courses', {
          filters: { college_id: profile.college_id, is_active: true },
          order: { column: 'course_name', ascending: true }
        });

        if (!mounted) return;

        if (response.success && response.data) {
          const coursesData = response.data as Course[];
          
          // For students, also fetch enrollment data
          if (profile.user_type === 'student') {
            const enrollmentResponse = await apiGateway.select('enrollments', {
              filters: { student_id: profile.id, status: 'enrolled' }
            });

            const enrolledCourseIds = enrollmentResponse.success 
              ? enrollmentResponse.data.map((e: any) => e.course_id)
              : [];

            const coursesWithEnrollment = coursesData.map(course => ({
              ...course,
              is_enrolled: enrolledCourseIds.includes(course.id)
            }));

            setCourses(coursesWithEnrollment);
          } else {
            setCourses(coursesData);
          }
        } else {
          setError(response.error || 'Failed to fetch courses');
          setCourses([]);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        if (mounted) {
          setError('Failed to fetch courses');
          setCourses([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCourses();

    return () => {
      mounted = false;
    };
  }, [profile]);

  const fetchAssignments = async (courseId?: string) => {
    if (!profile?.id) return;

    try {
      let filters: any = {};
      
      if (courseId) {
        filters.course_id = courseId;
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
        // Refresh courses to update enrollment status
        const updatedCourses = courses.map(course => 
          course.id === courseId ? { ...course, is_enrolled: true } : course
        );
        setCourses(updatedCourses);
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to enroll in course' };
    }
  };

  return {
    courses,
    assignments,
    loading,
    error,
    enrollInCourse,
    fetchAssignments,
    refetch: () => {
      setLoading(true);
      // This will trigger the useEffect to refetch
    }
  };
};
