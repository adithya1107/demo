
import React from 'react';
import SmartDashboard from '@/components/dashboard/SmartDashboard';

interface StudentDashboardProps {
  studentData: any;
}

const StudentDashboard = ({ studentData }: StudentDashboardProps) => {
  return <SmartDashboard />;
};

export default StudentDashboard;
