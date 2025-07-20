import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface FormData {
  college_code: string;
  user_code: string;
  password: string;
  user_type: 'super_admin' | 'faculty' | 'staff' | 'admin' | 'student' | 'parent' | 'alumni' | 'teacher';
  first_name: string;
  last_name: string;
  email: string;
}

const MultiStepLogin = () => {
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    college_code: '',
    user_code: '',
    password: '',
    user_type: 'student',
    first_name: '',
    last_name: '',
    email: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate college code first
      const { data: colleges, error: collegeError } = await supabase
        .from('colleges')
        .select('id, name')
        .eq('code', formData.college_code);

      if (collegeError) throw collegeError;
      if (!colleges || colleges.length === 0) {
        throw new Error('Invalid college code');
      }

      const college = colleges[0];

      // Check if user_code already exists for this college
      const { data: existingUsers, error: userCheckError } = await supabase
        .from('user_profiles')
        .select('user_code')
        .eq('college_id', college.id)
        .eq('user_code', formData.user_code);

      if (userCheckError) throw userCheckError;
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('User code already exists for this college');
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            user_type: formData.user_type,
            user_code: formData.user_code,
            college_id: college.id
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create user profile with properly typed data
      const userProfileData = {
        id: authData.user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_code: formData.user_code,
        user_type: formData.user_type as 'super_admin' | 'faculty' | 'staff' | 'admin' | 'student' | 'parent' | 'alumni' | 'teacher',
        email: formData.email,
        college_id: college.id
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(userProfileData);

      if (profileError) throw profileError;

      toast({
        title: 'Success!',
        description: 'Account created successfully. Please check your email for verification.',
      });

      // Reset form and switch to login
      setFormData({
        college_code: '',
        user_code: '',
        password: '',
        user_type: 'student',
        first_name: '',
        last_name: '',
        email: ''
      });
      setIsSignupMode(false);

    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during signup');
      toast({
        title: 'Signup Failed',
        description: error.message || 'An error occurred during signup',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: colleges, error: collegeError } = await supabase
        .from('colleges')
        .select('id, name')
        .eq('code', formData.college_code);

      if (collegeError) throw collegeError;
      if (!colleges || colleges.length === 0) {
        throw new Error('Invalid college code');
      }

      const college = colleges[0];

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      // Fetch user profile and store in localStorage
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      // Store user data in localStorage
      localStorage.setItem('colcord_user', JSON.stringify(profile));

      toast({
        title: 'Login Successful',
        description: `Welcome, ${profile.first_name} ${profile.last_name}!`,
      });

      // Redirect user based on user_type will now be handled by NavigationWrapper
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid credentials');
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollegeValidation = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name')
        .eq('code', formData.college_code);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Invalid college code');
      }

      toast({
        title: 'College Code Validated',
        description: `College: ${data[0].name}`,
      });
    } catch (error: any) {
      console.error('College validation error:', error);
      setError(error.message || 'Invalid college code');
      toast({
        title: 'College Code Invalid',
        description: error.message || 'Invalid college code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-8 space-y-6">
      <h2 className="text-2xl font-bold text-foreground text-center">
        {isSignupMode ? 'Create Account' : 'Login'}
      </h2>

      {error && (
        <div className="text-destructive text-sm text-center">{error}</div>
      )}

      <form onSubmit={isSignupMode ? handleSignup : handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="college_code">College Code</Label>
          <div className="relative">
            <Input
              type="text"
              id="college_code"
              name="college_code"
              value={formData.college_code}
              onChange={handleChange}
              placeholder="Enter college code"
              required
            />
            {!isSignupMode && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute right-1 top-1 rounded-md"
                onClick={handleCollegeValidation}
                disabled={isLoading}
              >
                Validate
              </Button>
            )}
          </div>
        </div>

        {isSignupMode && (
          <>
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="user_code">User Code</Label>
          <Input
            type="text"
            id="user_code"
            name="user_code"
            value={formData.user_code}
            onChange={handleChange}
            placeholder="Enter user code"
            required
          />
        </div>

        {isSignupMode && (
          <div>
            <Label htmlFor="user_type">User Type</Label>
            <Select
              onValueChange={(value) => setFormData(prev => ({ ...prev, user_type: value as FormData['user_type'] }))}
              defaultValue={formData.user_type}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
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
            placeholder="Enter password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            isSignupMode ? 'Create Account' : 'Login'
          )}
        </Button>
      </form>

      <Button
        type="button"
        variant="link"
        className="text-sm"
        onClick={() => setIsSignupMode(prev => !prev)}
      >
        {isSignupMode ? 'Already have an account? Login' : 'Need an account? Create one'}
      </Button>
    </div>
  );
};

export default MultiStepLogin;
