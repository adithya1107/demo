
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { auditLogger } from '@/utils/auditLogger';
import { securityMonitor } from '@/utils/securityMonitor';

interface PermissionWrapperProps {
  children: React.ReactNode;
  permission: keyof import('@/hooks/usePermissions').UserPermissions;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const PermissionWrapper = ({ 
  children, 
  permission, 
  fallback,
  showFallback = false 
}: PermissionWrapperProps) => {
  const { permissions, loading, user } = usePermissions();

  React.useEffect(() => {
    if (!loading && !permissions[permission]) {
      // Log unauthorized access attempt
      auditLogger.logUserAction(
        'unauthorized_access_attempt',
        `User attempted to access ${permission} without proper permissions`,
        'security',
        user?.id
      );
      
      // Report as potential privilege escalation
      securityMonitor.reportThreat({
        type: 'privilege_escalation',
        severity: 'medium',
        description: `Unauthorized access attempt to ${permission}`,
        userId: user?.id,
        metadata: {
          permission,
          userType: user?.user_type
        }
      });
    }
  }, [loading, permissions, permission, user]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!permissions[permission]) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    
    if (showFallback) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center p-6 text-gray-500">
            <Lock className="w-4 h-4 mr-2" />
            <span>Access restricted - Insufficient permissions</span>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

export default PermissionWrapper;
