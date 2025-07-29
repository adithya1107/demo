import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { apiGateway } from '@/utils/apiGateway';

export interface GradeSubmission {
  id: string;
  student_id: string;
  assignment_id: string;
  course_id: string;
  grade_value: number | null;
  grade_letter: string | null;
  graded_by: string | null;
  graded_at: string | null;
  feedback: string | null;
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradeWithDetails extends GradeSubmission {
  assignment_title?: string;
  course_name?: string;
  instructor_name?: string;
  max_marks?: number;
}

export const useGrades = () => {
  const { profile } = useUserProfile();
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchGrades = async () => {
      if (!profile?.id) {
        if (mounted) {
          setGrades([]);
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        
        if (profile.user_type === 'student') {
          // For students, fetch grades from grade_submissions table if it exists,
          // otherwise use assignment_submissions
          const response = await apiGateway.select('assignment_submissions', {
            filters: { student_id: profile.id },
            order: { column: 'submitted_at', ascending: false }
          });

          if (!mounted) return;

          if (response.success && response.data) {
            // Transform assignment submissions to grade format
            const gradesData = response.data.map((submission: any) => ({
              id: submission.id,
              student_id: submission.student_id,
              assignment_id: submission.assignment_id,
              course_id: '', // We'll need to get this from assignment
              grade_value: submission.marks_obtained,
              grade_letter: null,
              graded_by: submission.graded_by,
              graded_at: submission.graded_at,
              feedback: submission.feedback,
              is_final: !!submission.marks_obtained,
              created_at: submission.submitted_at,
              updated_at: submission.submitted_at,
              max_marks: null // We'll need to fetch this
            }));

            setGrades(gradesData);
          } else {
            setError(response.error || 'Failed to fetch grades');
            setGrades([]);
          }
        }
      } catch (err) {
        console.error('Error fetching grades:', err);
        if (mounted) {
          setError('Failed to fetch grades');
          setGrades([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchGrades();

    return () => {
      mounted = false;
    };
  }, [profile]);

  const submitGrade = async (gradeData: Omit<GradeSubmission, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await apiGateway.insert('grade_submissions', gradeData);
      
      if (response.success) {
        setLoading(true); // Trigger refetch
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to submit grade' };
    }
  };

  const updateGrade = async (gradeId: string, updates: Partial<GradeSubmission>) => {
    try {
      const response = await apiGateway.update('grade_submissions', updates, { id: gradeId });
      
      if (response.success) {
        setLoading(true); // Trigger refetch
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to update grade' };
    }
  };

  const calculateGPA = (gradesList: GradeWithDetails[]): number => {
    if (!gradesList.length) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    gradesList.forEach(grade => {
      if (grade.grade_value && grade.max_marks) {
        const percentage = (grade.grade_value / grade.max_marks) * 100;
        let gradePoints = 0;

        if (percentage >= 90) gradePoints = 4.0;
        else if (percentage >= 80) gradePoints = 3.0;
        else if (percentage >= 70) gradePoints = 2.0;
        else if (percentage >= 60) gradePoints = 1.0;
        else gradePoints = 0.0;

        totalPoints += gradePoints;
        totalCredits += 1;
      }
    });

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const getGradeStatistics = () => {
    const finalGrades = grades.filter(g => g.is_final);
    const gpa = calculateGPA(finalGrades);
    
    const gradeDistribution = finalGrades.reduce((acc, grade) => {
      if (grade.grade_letter) {
        acc[grade.grade_letter] = (acc[grade.grade_letter] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      gpa,
      totalGrades: finalGrades.length,
      gradeDistribution,
      averageScore: finalGrades.reduce((sum, grade) => {
        if (grade.grade_value && grade.max_marks) {
          return sum + (grade.grade_value / grade.max_marks) * 100;
        }
        return sum;
      }, 0) / finalGrades.length || 0
    };
  };

  return {
    grades,
    loading,
    error,
    submitGrade,
    updateGrade,
    getGradeStatistics,
    refetch: () => {
      setLoading(true);
      // This will trigger the useEffect to refetch
    }
  };
};
