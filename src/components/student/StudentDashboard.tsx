
import React from 'react';
import SmartDashboard from '@/components/dashboard/SmartDashboard';
import { useUserProfile } from '@/hooks/useUserProfile';

interface StudentDashboardProps {
  studentData?: any;
}

const StudentDashboard = ({ studentData }: StudentDashboardProps) => {
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-muted-foreground">Unable to load profile data</p>
      </div>
    );
  }

  return <SmartDashboard />;
};

export default StudentDashboard;
