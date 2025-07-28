
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
    if (profile?.id) {
      fetchGrades();
    }
  }, [profile?.id]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      
      if (profile?.user_type === 'student') {
        const response = await apiGateway.select('grade_submissions', {
          filters: { student_id: profile.id },
          order: { column: 'created_at', ascending: false }
        });

        if (response.success && response.data) {
          // Fetch additional details for each grade
          const gradesWithDetails = await Promise.all(
            response.data.map(async (grade: GradeSubmission) => {
              const [assignmentResponse, courseResponse] = await Promise.all([
                apiGateway.select('assignments', {
                  filters: { id: grade.assignment_id },
                  limit: 1
                }),
                apiGateway.select('courses', {
                  filters: { id: grade.course_id },
                  limit: 1
                })
              ]);

              const assignment = assignmentResponse.data?.[0];
              const course = courseResponse.data?.[0];

              return {
                ...grade,
                assignment_title: assignment?.title,
                course_name: course?.course_name,
                max_marks: assignment?.max_marks
              };
            })
          );

          setGrades(gradesWithDetails);
        }
      }
    } catch (err) {
      setError('Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  const submitGrade = async (gradeData: Omit<GradeSubmission, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await apiGateway.insert('grade_submissions', gradeData);
      
      if (response.success) {
        await fetchGrades(); // Refresh grades
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
        await fetchGrades(); // Refresh grades
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
        totalCredits += 1; // Assuming each assignment has equal weight
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
    refetch: fetchGrades
  };
};
