import React from 'react';
import SmartDashboard from '@/components/dashboard/SmartDashboard';

interface ParentDashboardProps {
  user: any;
}

const ParentDashboard = ({ user }: ParentDashboardProps) => {
  return <SmartDashboard />;
};

export default ParentDashboard;
