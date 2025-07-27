
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { HelpCircle, AlertTriangle } from 'lucide-react';

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
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    college_code: '',
    user_code: '',
    password: '',
    email: ''
  });

  const MAX_LOGIN_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Input sanitization to prevent XSS
    const sanitizedValue = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    setError(''); // Clear error when user types
  };

  const handleCollegeValidation = async () => {
    if (!formData.college_code.trim()) {
      setError('Please enter a college code');
      return;
    }

    // Input validation - only allow alphanumeric characters
    if (!/^[a-zA-Z0-9]+$/.test(formData.college_code)) {
      setError('College code can only contain letters and numbers');
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
    
    // Check if user is blocked due to too many attempts
    if (isBlocked) {
      setError('Account temporarily blocked due to multiple failed login attempts. Please try again later.');
      return;
    }

    if (!collegeValidated) {
      setError('Please validate your college code first');
      return;
    }

    // Enhanced input validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password strength validation (minimum requirements)
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting login with enhanced security...');
      
      // Sign in with Supabase Auth with enhanced security
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Handle specific auth errors
        if (authError.message.includes('Invalid login credentials')) {
          setLoginAttempts(prev => prev + 1);
          
          if (loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
            setIsBlocked(true);
            setTimeout(() => {
              setIsBlocked(false);
              setLoginAttempts(0);
            }, BLOCK_DURATION);
            
            toast({
              title: 'Account Blocked',
              description: 'Too many failed login attempts. Please try again in 15 minutes.',
              variant: 'destructive',
            });
            return;
          }
          
          setError(`Invalid email or password. ${MAX_LOGIN_ATTEMPTS - loginAttempts - 1} attempts remaining.`);
          return;
        }
        
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Login failed - no user returned');
      }

      console.log('Auth successful, validating user profile...');

      // Enhanced user profile validation
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

      // Verify user is active
      if (!profile.is_active) {
        throw new Error('User account is inactive. Please contact support.');
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

      // Reset login attempts on successful login
      setLoginAttempts(0);
      setIsBlocked(false);

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
      } else if (error.message?.includes('inactive')) {
        errorMessage = 'Your account is inactive. Please contact support.';
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
        <p className="text-muted-foreground">Secure login to your account</p>
        {collegeValidated && collegeName && (
          <p className="text-sm text-green-600 mt-2">✓ {collegeName}</p>
        )}
      </div>

      {error && (
        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md border border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {isBlocked && (
        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md border border-destructive/20">
          <AlertTriangle className="h-4 w-4 mx-auto mb-2" />
          <strong>Account Temporarily Blocked</strong>
          <p>Too many failed login attempts. Please try again in 15 minutes.</p>
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
              maxLength={10}
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
                maxLength={20}
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
                maxLength={100}
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
                minLength={6}
                maxLength={100}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isBlocked}
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

            {loginAttempts > 0 && (
              <div className="text-sm text-amber-600 text-center">
                Warning: {loginAttempts} failed attempt{loginAttempts > 1 ? 's' : ''}. 
                {MAX_LOGIN_ATTEMPTS - loginAttempts} remaining before account is blocked.
              </div>
            )}
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
