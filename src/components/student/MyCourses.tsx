// src/components/student/MyCourses.tsx

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import CourseCard from './courses/CourseCard'
import CourseDetailsDialog from './courses/CourseDetailsDialog'
import { useUserProfile } from '@/hooks/useUserProfile'

// === Data Interfaces (match your DB schema exactly) ===

export interface Course {
  id: string
  course_name: string
  course_code: string
  description: string
  credits: number
  semester: string
  academic_year: string
  instructor_id: string
  college_id: string
  is_active: boolean
  max_students: number
  created_at: string
  updated_at: string
}

export interface LectureMaterial {
  id: string
  course_id: string
  title: string
  description: string
  file_url: string
  material_type: string
  uploaded_by: string
  uploaded_at: string
}

export interface Assignment {
  id: string
  course_id: string
  title: string
  description: string
  due_date: string
  max_marks: number
  assignment_type: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  submission_text: string
  file_url?: string
  submitted_at: string
}

export interface Grade {
  id: string
  student_id: string
  course_id: string
  assignment_id: string
  marks_obtained: number
  max_marks: number
  grade_letter: string
  grade_type: string
  recorded_by: string
  recorded_at: string
}

export interface Certificate {
  id: string
  student_id: string
  course_id: string
  certificate_type: string
  certificate_url: string
  issued_by: string
  issued_date: string
  is_active: boolean
}

// === Props for this component ===

interface MyCoursesProps {
  studentData?: { user_id: string }
}

// === Props passed to CourseDetailsDialog ===

export interface CourseDetailsDialogProps {
  course: Course
  isOpen: boolean
  onClose: () => void
  lectureMaterials: LectureMaterial[]
  assignments: Assignment[]
  submissions: Submission[]
  grades: Grade[]
  certificates: Certificate[]
  onSubmitAssignment: (
    assignmentId: string,
    submissionText: string,
    fileUrl?: string
  ) => Promise<void>
}

const MyCourses: React.FC<MyCoursesProps> = ({ studentData }) => {
  const { profile } = useUserProfile()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [lectureMaterials, setLectureMaterials] = useState<LectureMaterial[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const currentStudentId = studentData?.user_id || profile?.id

  useEffect(() => {
    if (!currentStudentId) return
    fetchEnrolledCourses()
  }, [currentStudentId])

  const fetchEnrolledCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', currentStudentId)
      if (error) throw error
      const cs: Course[] = data?.map((e: any) => e.courses).filter(Boolean)
      setCourses(cs)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Error',
        description: 'Could not load your courses',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseDetails = async (courseId: string) => {
    try {
      // Lecture materials
      const { data: ldata } = await supabase
        .from('lecture_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('uploaded_at', { ascending: false })
      setLectureMaterials(ldata as LectureMaterial[])

      // Assignments
      const { data: adata } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date')
      setAssignments(adata as Assignment[])

      // Submissions
      const { data: sdata } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', currentStudentId)
        .in(
          'assignment_id',
          (adata as Assignment[]).map(a => a.id)
        )
      setSubmissions(sdata as Submission[])

      // Grades
      const { data: gdata } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', currentStudentId)
        .eq('course_id', courseId)
        .order('recorded_at', { ascending: false })
      setGrades(gdata as Grade[])

      // Certificates
      const { data: cdata } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', currentStudentId)
        .eq('course_id', courseId)
      setCertificates(cdata as Certificate[])
    } catch (err) {
      console.error(err)
      toast({
        title: 'Error',
        description: 'Could not load course details',
        variant: 'destructive',
      })
    }
  }

  const handleViewCourseDetails = (course: Course) => {
    setSelectedCourse(course)
    fetchCourseDetails(course.id)
  }

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
        })
      if (error) throw error
      toast({ title: 'Success', description: 'Submitted!' })
      if (selectedCourse) fetchCourseDetails(selectedCourse.id)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Error',
        description: 'Could not submit assignment',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">Loading courses…</div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <span className="text-gray-600">
          {courses.length} enrolled
        </span>
      </header>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No courses yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(c => (
            <CourseCard
              key={c.id}
              course={c}
              onViewDetails={() => handleViewCourseDetails(c)}
            />
          ))}
        </div>
      )}

      {selectedCourse && (
        <CourseDetailsDialog
          course={selectedCourse}
          isOpen={true}
          onClose={() => setSelectedCourse(null)}
          lectureMaterials={lectureMaterials}
          assignments={assignments}
          submissions={submissions}
          grades={grades}
          certificates={certificates}
          onSubmitAssignment={handleSubmitAssignment}
        />
      )}
    </div>
  )
}

export default MyCourses
