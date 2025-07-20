
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      localStorage.setItem('colcord_user', JSON.stringify(profile));

      toast({
        title: 'Login Successful',
        description: `Welcome, ${profile.first_name} ${profile.last_name}!`,
      });

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
      </div>

      {error && (
        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">{error}</div>
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
              placeholder="Enter your college code"
              required
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute right-1 top-1 rounded-md"
              onClick={handleCollegeValidation}
              disabled={isLoading || !formData.college_code}
            >
              Continue
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="user_code">User Code</Label>
          <Input
            type="text"
            id="user_code"
            name="user_code"
            value={formData.user_code}
            onChange={handleChange}
            placeholder="Enter your user code"
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
            placeholder="Enter your email"
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            'Login'
          )}
        </Button>
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
