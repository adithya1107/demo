import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

import { validateSessionIntegrity } from '@/utils/sessionSecurity';
import { securityMonitor } from '@/utils/securityMonitor';

const loginSchema = z.object({
  collegeCode: z.string().min(1, 'College code is required'),
  userCode: z.string().min(1, 'User code is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const MultiStepLogin = () => {
  const [step, setStep] = useState<'college' | 'credentials'>('college');
  const [collegeCode, setCollegeCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { session } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      collegeCode: '',
      userCode: '',
      password: '',
    },
  });

  const onSubmitCollege = useCallback(async (data: { collegeCode: string }) => {
    setLoading(true);
    try {
      const isValid = await validateCollegeCode(data.collegeCode);
      if (isValid) {
        setCollegeCode(data.collegeCode);
        setStep('credentials');
      } else {
        toast({
          title: 'Invalid College Code',
          description: 'Please enter a valid college code.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const onSubmitCredentials = useCallback(async (data: LoginFormData) => {
    setLoading(true);
    try {
      // Check rate limiting
      if (!securityMonitor.checkRateLimit(`login_attempt_${data.userCode}`)) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      const { data: authResponse, error } = await supabase.auth.signInWithPassword({
        email: `${data.userCode}@${data.collegeCode}.edu`,
        password: data.password,
      });

      if (error) {
        toast({
          title: 'Authentication Failed',
          description: error.message || 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
        securityMonitor.reportThreat({
          type: 'brute_force',
          severity: 'medium',
          description: `Failed login attempt for user: ${data.userCode}`,
          blocked: false
        });
      } else if (authResponse?.user) {
        toast({
          title: 'Login Successful',
          description: 'You have successfully logged in.',
        });
        navigate(redirect);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Authentication Error',
        description: error.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      securityMonitor.reportThreat({
        type: 'suspicious_activity',
        severity: 'high',
        description: `Login error for user: ${data.userCode} - ${error.message}`,
        blocked: true
      });
    } finally {
      setLoading(false);
    }
  }, [toast, navigate, redirect]);

  const validateCollegeCode = async (code: string): Promise<boolean> => {
    if (!code) return false;
    
    try {
      // Check rate limiting
      if (!securityMonitor.checkRateLimit(`college_validation_${code}`)) {
        throw new Error('Too many validation attempts. Please try again later.');
      }

      const { data, error } = await supabase.rpc('validate_college_user', {
        college_code: code,
        user_code: ''
      });

      if (error) throw error;
      
      return data && data.length > 0;
    } catch (error) {
      console.error('College validation error:', error);
      securityMonitor.reportThreat({
        type: 'suspicious_activity',
        severity: 'medium',
        description: `Failed college code validation: ${code}`,
        blocked: false
      });
      return false;
    }
  };

  if (session?.user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Already Logged In</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>You are already logged in. Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{step === 'college' ? 'Enter College Code' : 'Enter Credentials'}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'college' ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCollege)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="collegeCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your college code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Validating...' : 'Validate'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCredentials)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="collegeCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Code</FormLabel>
                      <FormControl>
                        <Input placeholder="College code" value={collegeCode} disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your user code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiStepLogin;
