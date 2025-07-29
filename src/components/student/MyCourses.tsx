
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCourses } from '@/hooks/useCourses';
import CourseCard from './courses/CourseCard';

interface MyCoursesProps {
  studentData?: {
    user_id: string;
    [key: string]: any;
  };
}

const MyCourses: React.FC<MyCoursesProps> = ({ studentData }) => {
  const { profile } = useUserProfile();
  const { courses, loading, error } = useCourses();
  const { toast } = useToast();

  // Determine current student ID
  const currentStudentId = studentData?.user_id || profile?.id;

  // Filter enrolled courses for students
  const enrolledCourses = profile?.user_type === 'student' 
    ? courses.filter(course => course.is_enrolled)
    : courses;

  const handleViewCourseDetails = (course: any) => {
    // This would typically open a course details dialog
    console.log('Viewing course details for:', course);
    toast({
      title: 'Course Details',
      description: `Opening details for ${course.course_name}`,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading courses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">My Courses</h2>
        <p className="text-muted-foreground">{enrolledCourses.length} enrolled courses</p>
      </div>

      {enrolledCourses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No courses enrolled yet</p>
            <p className="text-muted-foreground text-sm">
              Contact your administrator to get enrolled in courses
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onViewDetails={handleViewCourseDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
