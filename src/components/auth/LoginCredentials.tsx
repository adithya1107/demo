
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
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
      
      // Get college code from the validated college data
      const { data: collegeInfo } = await supabase
        .from('colleges')
        .select('code')
        .eq('id', collegeData.college_id)
        .single();

      if (!collegeInfo) {
        throw new Error('College information not found');
      }

      // Validate login credentials
      const { data: loginData, error: loginError } = await supabase.rpc('validate_login', {
        p_college_code: collegeInfo.code,
        p_user_code: sanitizedUserCode,
        p_password: password
      });

      if (loginError) throw loginError;

      if (loginData && loginData.length > 0) {
        const userData = loginData[0];
        
        if (userData.success) {
          // Create the email format that Supabase expects
          const email = `${sanitizedUserCode}@${collegeInfo.code.toLowerCase()}.edu`;
          
          // Sign in with Supabase Auth using the constructed email
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });

          if (authError) {
            // If user doesn't exist in auth, create them
            if (authError.message.includes('Invalid login credentials')) {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                  data: {
                    user_code: sanitizedUserCode,
                    college_id: userData.college_id,
                    user_type: userData.user_type,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                  }
                }
              });

              if (signUpError) throw signUpError;
              
              if (signUpData.user) {
                onLogin(userData);
                return;
              }
            } else {
              throw authError;
            }
          }

          if (authData.user) {
            onLogin(userData);
          }
        } else {
          toast({
            title: 'Login Failed',
            description: userData.error_message || 'Invalid credentials',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid credentials. Please check your user code and password.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: error.message || 'An error occurred during login. Please try again.',
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
