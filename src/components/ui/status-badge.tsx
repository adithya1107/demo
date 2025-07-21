
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'draft' | 'published' | 'archived' | 'present' | 'absent' | 'late' | 'excused';
  children?: React.ReactNode;
  className?: string;
}

const statusConfig = {
  active: { variant: 'default' as const, className: 'bg-role-student/20 text-role-student border-role-student/30' },
  inactive: { variant: 'secondary' as const, className: 'bg-muted text-muted-foreground' },
  pending: { variant: 'secondary' as const, className: 'bg-role-alumni/20 text-role-alumni border-role-alumni/30' },
  completed: { variant: 'default' as const, className: 'bg-role-student/20 text-role-student border-role-student/30' },
  cancelled: { variant: 'destructive' as const, className: 'bg-role-admin/20 text-role-admin border-role-admin/30' },
  draft: { variant: 'secondary' as const, className: 'bg-muted text-muted-foreground' },
  published: { variant: 'default' as const, className: 'bg-role-student/20 text-role-student border-role-student/30' },
  archived: { variant: 'secondary' as const, className: 'bg-muted text-muted-foreground' },
  present: { variant: 'default' as const, className: 'bg-role-student/20 text-role-student border-role-student/30' },
  absent: { variant: 'destructive' as const, className: 'bg-role-admin/20 text-role-admin border-role-admin/30' },
  late: { variant: 'secondary' as const, className: 'bg-role-alumni/20 text-role-alumni border-role-alumni/30' },
  excused: { variant: 'secondary' as const, className: 'bg-role-teacher/20 text-role-teacher border-role-teacher/30' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className }) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default StatusBadge;
