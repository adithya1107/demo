
import React from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserProfileProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile = ({ user, isOpen, onClose }: UserProfileProps) => {
  if (!isOpen) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleIcon = (userType: string) => {
    switch (userType) {
      case 'student':
        return <GraduationCap className="h-4 w-4" />;
      case 'faculty':
      case 'teacher':
        return <Briefcase className="h-4 w-4" />;
      case 'parent':
        return <User className="h-4 w-4" />;
      case 'alumni':
        return <GraduationCap className="h-4 w-4" />;
      case 'admin':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (userType: string) => {
    switch (userType) {
      case 'student':
        return 'text-role-student';
      case 'faculty':
      case 'teacher':
        return 'text-role-teacher';
      case 'parent':
        return 'text-role-parent';
      case 'alumni':
        return 'text-role-alumni';
      case 'admin':
        return 'text-role-admin';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed right-4 top-20 w-96 max-h-[80vh] overflow-y-auto bg-card border border-white/10 rounded-lg shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Profile</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
              <AvatarFallback className="text-lg">
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            
            <h3 className="text-lg font-semibold text-foreground text-center">
              {user.first_name} {user.last_name}
            </h3>
            
            <div className={`flex items-center space-x-2 mt-2 ${getRoleColor(user.user_type)}`}>
              {getRoleIcon(user.user_type)}
              <span className="text-sm font-medium capitalize">
                {user.user_type === 'faculty' ? 'Teacher' : user.user_type}
              </span>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            {user.user_code && (
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">User Code</p>
                  <p className="text-sm font-medium text-foreground">{user.user_code}</p>
                </div>
              </div>
            )}

            {user.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                </div>
              </div>
            )}

            {user.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground">{user.phone}</p>
                </div>
              </div>
            )}

            {user.address && (
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="text-sm font-medium text-foreground">{user.address}</p>
                </div>
              </div>
            )}

            {user.date_of_birth && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(user.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Additional Info Based on User Type */}
            {user.user_type === 'student' && user.student_id && (
              <div className="flex items-center space-x-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="text-sm font-medium text-foreground">{user.student_id}</p>
                </div>
              </div>
            )}

            {user.user_type === 'alumni' && user.graduation_year && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Graduation Year</p>
                  <p className="text-sm font-medium text-foreground">{user.graduation_year}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Future: Navigate to edit profile page
                console.log('Edit profile clicked');
              }}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
