import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeInput } from '@/utils/security';

interface LoginCredentialsProps {
  collegeData: any;
  onLogin: (userData: any) => void;
  onBack: () => void;
}

export const LoginCredentials: React.FC<LoginCredentialsProps> = ({ 
  collegeData, 
  onLogin, 
  onBack 
}) => {
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!userCode.trim()) {
      toast({
        title: 'Error',
        description: 'User code is required',
        variant: 'destructive',
      });
      return;
    }

    if (!password) {
      toast({
        title: 'Error',
        description: 'Password is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const sanitizedUserCode = sanitizeInput(userCode.trim());
      
      // First, verify user exists and get their email
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, user_type, first_name, last_name, email, college_id, is_active, user_code')
        .eq('user_code', sanitizedUserCode)
        .eq('college_id', collegeData.college_id)
        .eq('is_active', true)
        .single();

      if (profileError || !userProfile) {
        toast({
          title: 'Login Failed',
          description: 'User not found or account inactive. Please check your user code.',
          variant: 'destructive',
        });
        return;
      }

      // Use the email directly from the user profile
      if (!userProfile.email) {
        throw new Error('User email not found in profile');
      }

      // Authenticate with Supabase Auth using the stored email and provided password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: password,
      });

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes('Invalid login credentials')) {
          toast({
            title: 'Login Failed',
            description: 'Invalid password. Please check your credentials and try again.',
            variant: 'destructive',
          });
        } else if (authError.message.includes('Email not confirmed')) {
          toast({
            title: 'Account Not Verified',
            description: 'Please verify your email address before logging in.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Authentication Error',
            description: authError.message || 'Authentication failed. Please try again.',
            variant: 'destructive',
          });
        }
        return;
      }

      if (authData.user) {
        // Successful authentication - pass user profile data to parent
        onLogin({
          ...userProfile,
          auth_user_id: authData.user.id
        });
        
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userProfile.first_name}!`,
        });
      }

    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: error.message || 'An unexpected error occurred during login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Login to {collegeData.college_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userCode" className="block text-sm font-medium mb-2">
              User Code
            </label>
            <Input
              id="userCode"
              type="text"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="Enter your user code"
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
              Back
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !userCode.trim() || !password} 
              className="flex-1"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};