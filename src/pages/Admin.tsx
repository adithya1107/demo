import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminDashboard from '@/components/admin/AdminDashboard';
import EnhancedUserManagement from '@/components/admin/EnhancedUserManagement';
import SystemArchitecture from '@/components/admin/SystemArchitecture';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePermissions } from '@/hooks/usePermissions';
import PermissionWrapper from '@/components/PermissionWrapper';

const Admin = () => {
  const { profile } = useUserProfile();
  const { permissions } = usePermissions();

  if (!profile) {
    return <div>Loading...</div>;
  }

  // Mock admin roles for now - this should come from the database
  const adminRoles = [
    {
      role_type: 'super_admin',
      permissions: permissions,
      assigned_at: new Date().toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="architecture">System Architecture</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <PermissionWrapper permission="view_personal_dashboard">
              <AdminDashboard />
            </PermissionWrapper>
          </TabsContent>

          <TabsContent value="users">
            <PermissionWrapper permission="view_personal_dashboard">
              <EnhancedUserManagement 
                userProfile={profile as any}
                adminRoles={adminRoles}
              />
            </PermissionWrapper>
          </TabsContent>

          <TabsContent value="architecture">
            <PermissionWrapper permission="view_personal_dashboard">
              <SystemArchitecture />
            </PermissionWrapper>
          </TabsContent>

          <TabsContent value="settings">
            <PermissionWrapper permission="view_personal_dashboard">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">System Settings</h3>
                <p className="text-muted-foreground">Settings panel coming soon...</p>
              </div>
            </PermissionWrapper>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
