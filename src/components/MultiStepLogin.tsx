import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { HelpCircle, AlertTriangle, Shield } from 'lucide-react';
import SecureInput from '@/components/SecureInput';
import { useSecurityContext } from '@/components/SecurityProvider';
import { validateSessionIntegrity } from '@/utils/sessionSecurity';
import { 
  validateEmail, 
  validatePassword, 
  validateUserCode, 
  validateCollegeCode,
  sanitizeInput 
} from '@/utils/security';

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
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const navigate = useNavigate();
  const { rateLimiter, reportSecurityViolation } = useSecurityContext();

  const [formData, setFormData] = useState<FormData>({
    college_code: '',
    user_code: '',
    password: '',
    email: ''
  });

  const MAX_LOGIN_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  // Enhanced session validation check
  useEffect(() => {
    const checkSession = async () => {
      const isValid = await validateSessionIntegrity();
      if (isValid) {
        // User already has valid session, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    };
    
    checkSession();
  }, [navigate]);

  // Check if user is rate limited
  useEffect(() => {
    const clientId = localStorage.getItem('client_id') || 
      (Math.random().toString(36).substr(2, 9) + Date.now().toString(36));
    
    if (!localStorage.getItem('client_id')) {
      localStorage.setItem('client_id', clientId);
    }
    
    const remaining = rateLimiter.getRemainingAttempts(clientId);
    setIsBlocked(remaining <= 0);
  }, [rateLimiter]);

  const handleSecurityViolation = useCallback((violation: string) => {
    reportSecurityViolation(violation, {
      component: 'MultiStepLogin',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }, [reportSecurityViolation]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Additional validation based on field
    let isValid = true;
    let sanitizedValue = value;

    switch (name) {
      case 'college_code':
        isValid = validateCollegeCode(value);
        sanitizedValue = sanitizeInput(value, 10).toUpperCase();
        break;
      case 'user_code':
        isValid = validateUserCode(value);
        sanitizedValue = sanitizeInput(value, 20).toUpperCase();
        break;
      case 'email':
        isValid = validateEmail(value);
        sanitizedValue = sanitizeInput(value, 320).toLowerCase();
        break;
      case 'password':
        const validation = validatePassword(value);
        setPasswordErrors(validation.errors);
        sanitizedValue = value; // Don't sanitize password, but validate it
        break;
      default:
        sanitizedValue = sanitizeInput(value, 100);
    }

    if (!isValid && name !== 'password') {
      handleSecurityViolation(`Invalid ${name} format`);
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    setError(''); // Clear error when user types
  }, [handleSecurityViolation]);

  const handleCollegeValidation = async () => {
    if (!formData.college_code.trim()) {
      setError('Please enter a college code');
      return;
    }

    if (!validateCollegeCode(formData.college_code)) {
      setError('College code format is invalid');
      handleSecurityViolation('Invalid college code format');
      return;
    }

    const clientId = localStorage.getItem('client_id') || 'unknown';
    if (!rateLimiter.isAllowed(clientId)) {
      setIsBlocked(true);
      setError('Too many attempts. Please try again later.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name, code')
        .eq('code', formData.college_code)
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
      handleSecurityViolation('College validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const clientId = localStorage.getItem('client_id') || 'unknown';
    
    // Enhanced rate limiting check
    if (!rateLimiter.isAllowed(clientId)) {
      setIsBlocked(true);
      setError('Account temporarily blocked due to multiple failed login attempts. Please try again later.');
      reportSecurityViolation('Rate limit exceeded during login', { clientId });
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

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      handleSecurityViolation('Invalid email format in login');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError('Password does not meet security requirements');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting secure login with enhanced validation...');
      
      // Enhanced security: Log login attempt
      reportSecurityViolation('Login attempt', {
        email: formData.email,
        college_code: formData.college_code,
        user_code: formData.user_code,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        clientId
      });
      
      // Sign in with Supabase Auth with enhanced security
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Enhanced error handling with security logging
        if (authError.message.includes('Invalid login credentials')) {
          setLoginAttempts(prev => prev + 1);
          
          reportSecurityViolation('Failed login attempt', {
            email: formData.email,
            college_code: formData.college_code,
            attempt_number: loginAttempts + 1,
            error: authError.message
          });
          
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

      console.log('Auth successful, validating user profile with enhanced security...');

      // Enhanced user profile validation with integrity checks
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        reportSecurityViolation('Profile validation failed', {
          user_id: authData.user.id,
          error: profileError.message
        });
        throw new Error('Unable to fetch user profile');
      }

      if (!profile) {
        reportSecurityViolation('User profile not found', {
          user_id: authData.user.id
        });
        throw new Error('User profile not found');
      }

      // Enhanced security checks
      if (!profile.is_active) {
        reportSecurityViolation('Inactive user login attempt', {
          user_id: authData.user.id,
          profile
        });
        throw new Error('User account is inactive. Please contact support.');
      }

      // Verify user belongs to the specified college with enhanced validation
      const { data: college } = await supabase
        .from('colleges')
        .select('id, name, code')
        .eq('code', formData.college_code)
        .single();

      if (!college || profile.college_id !== college.id) {
        reportSecurityViolation('College mismatch during login', {
          user_id: authData.user.id,
          provided_college: formData.college_code,
          user_college_id: profile.college_id,
          college_id: college?.id
        });
        throw new Error('User does not belong to the specified college');
      }

      // Enhanced session security: Validate session integrity
      const sessionValid = await validateSessionIntegrity();
      if (!sessionValid) {
        reportSecurityViolation('Session validation failed after login', {
          user_id: authData.user.id
        });
        throw new Error('Session validation failed');
      }

      // Reset login attempts on successful login
      setLoginAttempts(0);
      setIsBlocked(false);
      rateLimiter.reset(clientId);

      // Log successful login
      reportSecurityViolation('Successful login', {
        user_id: authData.user.id,
        college_code: formData.college_code,
        user_type: profile.user_type
      });

      console.log('Secure login successful for:', profile.first_name, profile.last_name);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${profile.first_name} ${profile.last_name}!`,
      });

      // The NavigationWrapper will handle the redirect based on user type
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Enhanced error logging
      reportSecurityViolation('Login error', {
        error: error.message,
        stack: error.stack,
        email: formData.email,
        college_code: formData.college_code
      });
      
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
        <div className="flex items-center justify-center mb-2">
          <Shield className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-foreground">Secure College Access</h2>
        </div>
        <p className="text-muted-foreground">Enhanced security login to your account</p>
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
            <SecureInput
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
              allowedChars={/[A-Z0-9]/}
              onSecurityViolation={handleSecurityViolation}
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
              <SecureInput
                type="text"
                id="user_code"
                name="user_code"
                value={formData.user_code}
                onChange={handleChange}
                placeholder="Enter your user code (e.g., ANI0002)"
                required
                maxLength={20}
                allowedChars={/[A-Z0-9]/}
                onSecurityViolation={handleSecurityViolation}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <SecureInput
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
                maxLength={320}
                onSecurityViolation={handleSecurityViolation}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <SecureInput
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                minLength={8}
                maxLength={128}
                onSecurityViolation={handleSecurityViolation}
              />
              {passwordErrors.length > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  <ul className="list-disc list-inside">
                    {passwordErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isBlocked || passwordErrors.length > 0}
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
