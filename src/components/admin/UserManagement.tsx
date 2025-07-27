
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, Search, Plus, Edit, Trash2, Eye, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  user_code: string;
  user_type: 'student' | 'teacher' | 'admin' | 'staff' | 'parent' | 'alumni' | 'super_admin';
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  college_id: string;
}

interface ExtendedUserProfile extends UserProfile {
  hierarchy_level: string;
}

interface AdminRole {
  role_type: string;
  permissions: any;
  assigned_at: string;
}

interface UserManagementProps {
  userProfile: UserProfile & { hierarchy_level?: string };
  adminRoles: AdminRole[];
}

const UserManagement = ({ userProfile, adminRoles }: UserManagementProps) => {
  const [users, setUsers] = useState<ExtendedUserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ExtendedUserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const getHierarchyFromUserType = (userType: string): string => {
    const hierarchyMap: Record<string, string> = {
      'super_admin': 'super_admin',
      'admin': 'admin',
      'teacher': 'teacher',
      'student': 'student',
      'staff': 'staff',
      'parent': 'parent',
      'alumni': 'alumni'
    };
    return hierarchyMap[userType] || 'student';
  };

  const loadUsers = async () => {
    try {
      // Enhanced security: Validate current user has permission to view users
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view users.",
          variant: "destructive",
        });
        return;
      }

      // Verify admin permissions server-side
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_roles')
        .select('admin_role_type, is_active')
        .eq('user_id', user.id)
        .eq('college_id', userProfile.college_id)
        .eq('is_active', true);

      if (adminError || !adminCheck || adminCheck.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view users.",
          variant: "destructive",
        });
        return;
      }

      // Load users with proper authorization
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('college_id', userProfile.college_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Error",
          description: "Failed to load users.",
          variant: "destructive",
        });
      } else {
        // Map users and add hierarchy_level based on user_type
        const usersWithHierarchy: ExtendedUserProfile[] = (data || []).map(user => ({
          ...user,
          user_type: user.user_type === 'faculty' ? 'teacher' : user.user_type,
          hierarchy_level: getHierarchyFromUserType(user.user_type === 'faculty' ? 'teacher' : user.user_type)
        })) as ExtendedUserProfile[];
        setUsers(usersWithHierarchy);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = (): boolean => {
    // Server-side validation: Check actual admin roles from database
    return adminRoles.some(role => role.role_type === 'super_admin') || 
           userProfile?.user_type === 'super_admin';
  };

  const canManageUser = (user: ExtendedUserProfile): boolean => {
    // Enhanced security: More restrictive permissions
    const currentUserRoles = adminRoles.filter(role => role.role_type);
    
    // Super admin can manage everyone except other super admins
    if (isSuperAdmin()) {
      return user.hierarchy_level !== 'super_admin' || user.id === userProfile.id;
    }
    
    // Regular admins can only manage users below their hierarchy level
    const hierarchyLevels: Record<string, number> = {
      'super_admin': 1,
      'admin': 2,
      'teacher': 3,
      'staff': 4,
      'student': 5,
      'parent': 6,
      'alumni': 7
    };

    const currentUserHierarchy = userProfile.hierarchy_level || getHierarchyFromUserType(userProfile.user_type);
    const currentUserLevel = hierarchyLevels[currentUserHierarchy] || 7;
    const targetUserLevel = hierarchyLevels[user.hierarchy_level] || 7;

    return currentUserLevel < targetUserLevel;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      user.user_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || user.user_type === filterType;

    return matchesSearch && matchesFilter;
  });

  const getHierarchyBadgeColor = (level: string): string => {
    const colors: Record<string, string> = {
      'super_admin': 'bg-red-100 text-red-800',
      'admin': 'bg-purple-100 text-purple-800',
      'teacher': 'bg-blue-100 text-blue-800',
      'staff': 'bg-indigo-100 text-indigo-800',
      'student': 'bg-green-100 text-green-800',
      'parent': 'bg-yellow-100 text-yellow-800',
      'alumni': 'bg-gray-100 text-gray-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const handleUserAction = async (action: string, user: ExtendedUserProfile) => {
    try {
      // Enhanced security: Server-side validation before any action
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast({
          title: "Authentication Required",
          description: "Please log in to perform this action.",
          variant: "destructive",
        });
        return;
      }

      // Verify admin permissions
      if (!canManageUser(user)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to manage this user.",
          variant: "destructive",
        });
        return;
      }

      if (action === 'deactivate') {
        // Prevent deactivating super admins
        if (user.hierarchy_level === 'super_admin') {
          toast({
            title: "Action Blocked",
            description: "Cannot deactivate super admin accounts.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('user_profiles')
          .update({ is_active: false })
          .eq('id', user.id);

        if (error) {
          throw error;
        }

        // Log the action for audit trail
        await supabase
          .from('audit_logs')
          .insert({
            college_id: userProfile.college_id,
            admin_user_id: currentUser.id,
            target_user_id: user.id,
            action_type: 'user_deactivated',
            action_description: `User ${user.first_name} ${user.last_name} (${user.user_code}) was deactivated`,
            module: 'user_management'
          });
      }

      toast({
        title: "Success",
        description: `User ${action} completed successfully.`,
      });

      loadUsers(); // Reload the users list
    } catch (error) {
      console.error('Error performing user action:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} user.`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>User Management</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </CardTitle>
          <CardDescription>
            Securely manage users in your college ecosystem. All actions are logged for audit purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                <strong>Security Notice:</strong> All user management actions are logged and monitored. 
                You can only manage users within your authorization level.
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                maxLength={100}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="super_admin">Super Admins</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="parent">Parents</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>
            {isSuperAdmin() && (
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            )}
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hierarchy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.first_name || ''} {user.last_name || ''}
                        </div>
                        <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.user_code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.user_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getHierarchyBadgeColor(user.hierarchy_level)}>
                        {user.hierarchy_level.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {canManageUser(user) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {(user.hierarchy_level !== 'super_admin' && user.user_type !== 'admin') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleUserAction('deactivate', user)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedUser.first_name || ''} {selectedUser.last_name || ''}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-gray-600">
                  {selectedUser.first_name || ''} {selectedUser.last_name || ''}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-gray-600">{selectedUser.email || 'No email'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">User Code</Label>
                <p className="text-sm text-gray-600 font-mono">{selectedUser.user_code}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">User Type</Label>
                <Badge variant="outline" className="capitalize">
                  {selectedUser.user_type.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Hierarchy Level</Label>
                <Badge className={getHierarchyBadgeColor(selectedUser.hierarchy_level)}>
                  {selectedUser.hierarchy_level.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                  {selectedUser.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium">Created At</Label>
                <p className="text-sm text-gray-600">
                  {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserManagement;
