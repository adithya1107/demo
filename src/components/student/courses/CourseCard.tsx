
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CourseCardProps {
  course: {
    id: string;
    course_name: string;
    course_code: string;
    description: string;
    credits: number;
    semester: string;
    academic_year: string;
  };
  onViewDetails: (course: any) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onViewDetails }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{course.course_name}</span>
          <Badge variant="secondary">{course.course_code}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-4">{course.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Credits: {course.credits}</span>
          <span>{course.semester} {course.academic_year}</span>
        </div>
        <Button 
          onClick={() => onViewDetails(course)}
          className="w-full"
        >
          View Course Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
