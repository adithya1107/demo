
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { HelpCircle } from 'lucide-react';

interface FormData {
  college_code: string;
  user_code: string;
  password: string;
  email: string;
}

const MultiStepLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [collegeValidated, setCollegeValidated] = useState(false);
  const [collegeName, setCollegeName] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    college_code: '',
    user_code: '',
    password: '',
    email: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const handleCollegeValidation = async () => {
    if (!formData.college_code.trim()) {
      setError('Please enter a college code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name, code')
        .eq('code', formData.college_code.toUpperCase())
        .single();

      if (error || !data) {
        setError('Invalid college code. Please check and try again.');
        setCollegeValidated(false);
        setCollegeName('');
        toast({
          title: 'College Code Invalid',
          description: 'Please enter a valid college code.',
          variant: 'destructive',
        });
        return;
      }

      setCollegeValidated(true);
      setCollegeName(data.name);
      toast({
        title: 'College Code Validated',
        description: `Welcome to ${data.name}!`,
      });
    } catch (error: any) {
      console.error('College validation error:', error);
      setError('Unable to validate college code. Please try again.');
      setCollegeValidated(false);
      setCollegeName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collegeValidated) {
      setError('Please validate your college code first');
      return;
    }

    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', formData.email);
      
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Login failed - no user returned');
      }

      console.log('Auth successful, fetching profile...');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Unable to fetch user profile');
      }

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Verify user belongs to the specified college
      const { data: college } = await supabase
        .from('colleges')
        .select('id')
        .eq('code', formData.college_code.toUpperCase())
        .single();

      if (!college || profile.college_id !== college.id) {
        throw new Error('User does not belong to the specified college');
      }

      console.log('Login successful for:', profile.first_name, profile.last_name);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${profile.first_name} ${profile.last_name}!`,
      });

      // The NavigationWrapper will handle the redirect based on user type
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    toast({
      title: 'Contact Support',
      description: 'For assistance, please email: support@colcord.edu or call: +91-8050661601',
    });
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-8 space-y-6 border border-white/10">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">College Access</h2>
        <p className="text-muted-foreground">Login to your account</p>
        {collegeValidated && collegeName && (
          <p className="text-sm text-green-600 mt-2">✓ {collegeName}</p>
        )}
      </div>

      {error && (
        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="college_code">College Code</Label>
          <div className="relative">
            <Input
              type="text"
              id="college_code"
              name="college_code"
              value={formData.college_code}
              onChange={handleChange}
              placeholder="Enter your college code (e.g., MIT01)"
              required
              className={collegeValidated ? "pr-20 border-green-500" : "pr-20"}
              disabled={collegeValidated}
            />
            {!collegeValidated ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute right-1 top-1 h-8 px-3 text-xs"
                onClick={handleCollegeValidation}
                disabled={isLoading || !formData.college_code.trim()}
              >
                {isLoading ? 'Checking...' : 'Validate'}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="absolute right-1 top-1 h-8 px-3 text-xs"
                onClick={() => {
                  setCollegeValidated(false);
                  setCollegeName('');
                  setFormData(prev => ({ ...prev, college_code: '' }));
                }}
              >
                Change
              </Button>
            )}
          </div>
        </div>

        {collegeValidated && (
          <>
            <div>
              <Label htmlFor="user_code">User Code</Label>
              <Input
                type="text"
                id="user_code"
                name="user_code"
                value={formData.user_code}
                onChange={handleChange}
                placeholder="Enter your user code (e.g., ANI0002)"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </div>
              ) : (
                'Login'
              )}
            </Button>
          </>
        )}
      </form>

      <div className="text-center pt-4 border-t border-white/10">
        <Button
          type="button"
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={handleContactSupport}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Need assistance? Contact support
        </Button>
      </div>
    </div>
  );
};

export default MultiStepLogin;
