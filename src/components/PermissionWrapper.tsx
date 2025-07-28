
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { auditLogger } from '@/utils/auditLogger';
import { securityMonitor } from '@/utils/securityMonitor';

interface PermissionWrapperProps {
  children: React.ReactNode;
  permission: keyof import('@/hooks/usePermissions').UserPermissions;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  children,
  permission,
  fallback,
  showFallback = false 
}) => {
  const { permissions, loading, userType, userId, profile } = usePermissions();

  React.useEffect(() => {
    if (!loading && !permissions[permission]) {
      // Log unauthorized access attempt
      auditLogger.logUserAction(
        'unauthorized_access_attempt',
        `User attempted to access ${permission} without proper permissions`,
        'security',
        userId
      );
      
      // Report as potential privilege escalation
      securityMonitor.reportThreat({
        type: 'privilege_escalation',
        severity: 'medium',
        description: `Unauthorized access attempt to ${permission}`,
        userId: userId,
        metadata: {
          permission,
          userType: userType,
          profileId: profile?.id
        },
        blocked: true
      });
    }
  }, [loading, permissions, permission, userType, userId, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!permissions[permission]) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    
    if (showFallback) {
      return (
        <Card className="m-4">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                You don't have permission to access this feature.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

export default PermissionWrapper;
