
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
import { auditLogger } from '@/utils/auditLogger';
import { securityMonitor } from '@/utils/securityMonitor';
import { dbSecurityValidator } from '@/utils/databaseSecurity';
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
        navigate('/dashboard', { replace: true });
      }
    };
    
    checkSession();
  }, [navigate]);

  // Security monitoring for rate limiting
  useEffect(() => {
    const clientId = localStorage.getItem('client_id') || 
      (Math.random().toString(36).substr(2, 9) + Date.now().toString(36));
    
    if (!localStorage.getItem('client_id')) {
      localStorage.setItem('client_id', clientId);
    }
    
    const checkRateLimit = async () => {
      const allowed = await securityMonitor.checkRateLimit(clientId);
      setIsBlocked(!allowed);
    };
    
    checkRateLimit();
  }, []);

  const handleSecurityViolation = useCallback(async (violation: string) => {
    reportSecurityViolation(violation, {
      component: 'MultiStepLogin',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    await securityMonitor.reportThreat({
      type: 'suspicious_activity',
      severity: 'medium',
      description: violation,
      userAgent: navigator.userAgent,
    });
  }, [reportSecurityViolation]);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Check for injection attempts
    const isInjection = await securityMonitor.detectInjectionAttempt(
      value,
      `login_form_${name}`
    );
    
    if (isInjection) {
      await handleSecurityViolation(`Injection attempt in ${name} field`);
      return;
    }
    
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
      await handleSecurityViolation(`Invalid ${name} format`);
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    setError('');
  }, [handleSecurityViolation]);

  const handleCollegeValidation = async () => {
    if (!formData.college_code.trim()) {
      setError('Please enter a college code');
      return;
    }

    if (!validateCollegeCode(formData.college_code)) {
      setError('College code format is invalid');
      await handleSecurityViolation('Invalid college code format');
      return;
    }

    const clientId = localStorage.getItem('client_id') || 'unknown';
    const rateAllowed = await securityMonitor.checkRateLimit(clientId);
    
    if (!rateAllowed) {
      setIsBlocked(true);
      setError('Too many attempts. Please try again later.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use secure database validation
      const collegeData = await dbSecurityValidator.validateAndExecuteQuery(
        supabase
          .from('colleges')
          .select('id, name, code')
          .eq('code', formData.college_code)
          .single(),
        'select',
        'college_validation'
      );

      if (!collegeData) {
        setError('Invalid college code. Please check and try again.');
        setCollegeValidated(false);
        setCollegeName('');
        
        await auditLogger.logSecurityEvent(
          'invalid_college_code',
          `Invalid college code attempted: ${formData.college_code}`,
          'low'
        );
        
        toast({
          title: 'College Code Invalid',
          description: 'Please enter a valid college code.',
          variant: 'destructive',
        });
        return;
      }

      setCollegeValidated(true);
      setCollegeName(collegeData.name);
      
      await auditLogger.logUserAction(
        'college_validation',
        `College code validated: ${collegeData.name}`,
        'authentication'
      );
      
      toast({
        title: 'College Code Validated',
        description: `Welcome to ${collegeData.name}!`,
      });
    } catch (error: any) {
      console.error('College validation error:', error);
      setError('Unable to validate college code. Please try again.');
      setCollegeValidated(false);
      setCollegeName('');
      await handleSecurityViolation('College validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const clientId = localStorage.getItem('client_id') || 'unknown';
    
    // Enhanced rate limiting check
    const rateAllowed = await securityMonitor.checkRateLimit(clientId);
    
    if (!rateAllowed) {
      setIsBlocked(true);
      setError('Account temporarily blocked due to multiple failed login attempts. Please try again later.');
      await securityMonitor.reportThreat({
        type: 'brute_force',
        severity: 'high',
        description: 'Rate limit exceeded during login',
        metadata: { clientId }
      });
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
      await handleSecurityViolation('Invalid email format in login');
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
      console.log('Attempting secure login with comprehensive security monitoring...');
      
      // Log login attempt
      await auditLogger.logLoginAttempt(false, formData.email, 'attempt_started');
      
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
          
          await auditLogger.logLoginAttempt(false, formData.email, 'invalid_credentials');
          await securityMonitor.reportThreat({
            type: 'brute_force',
            severity: 'medium',
            description: 'Failed login attempt with invalid credentials',
            metadata: {
              email: formData.email,
              attempt_number: loginAttempts + 1
            }
          });
          
          if (loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
            setIsBlocked(true);
            setTimeout(() => {
              setIsBlocked(false);
              setLoginAttempts(0);
            }, BLOCK_DURATION);
            
            await securityMonitor.reportThreat({
              type: 'brute_force',
              severity: 'high',
              description: 'Account blocked due to multiple failed login attempts',
              metadata: { email: formData.email }
            });
            
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
      const profileData = await dbSecurityValidator.validateAndExecuteQuery(
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single(),
        'select',
        'user_profile_validation'
      );

      if (!profileData) {
        await auditLogger.logSecurityEvent(
          'user_profile_not_found',
          `User profile not found for authenticated user: ${authData.user.id}`,
          'high'
        );
        throw new Error('User profile not found');
      }

      // Enhanced security checks
      if (!profileData.is_active) {
        await securityMonitor.reportThreat({
          type: 'suspicious_activity',
          severity: 'medium',
          description: 'Inactive user attempted login',
          userId: authData.user.id,
          metadata: { profile: profileData }
        });
        throw new Error('User account is inactive. Please contact support.');
      }

      // Verify user belongs to the specified college with enhanced validation
      const collegeData = await dbSecurityValidator.validateAndExecuteQuery(
        supabase
          .from('colleges')
          .select('id, name, code')
          .eq('code', formData.college_code)
          .single(),
        'select',
        'college_verification'
      );

      if (!collegeData || profileData.college_id !== collegeData.id) {
        await securityMonitor.reportThreat({
          type: 'privilege_escalation',
          severity: 'high',
          description: 'User attempted to access different college',
          userId: authData.user.id,
          metadata: {
            provided_college: formData.college_code,
            user_college_id: profileData.college_id,
            college_id: collegeData?.id
          }
        });
        throw new Error('User does not belong to the specified college');
      }

      // Enhanced session security: Validate session integrity
      const sessionValid = await validateSessionIntegrity();
      if (!sessionValid) {
        await auditLogger.logSecurityEvent(
          'session_validation_failed',
          `Session validation failed after login for user: ${authData.user.id}`,
          'high'
        );
        throw new Error('Session validation failed');
      }

      // Reset login attempts on successful login
      setLoginAttempts(0);
      setIsBlocked(false);

      // Log successful login
      await auditLogger.logLoginAttempt(true, formData.email, 'login_successful');
      await auditLogger.logUserAction(
        'successful_login',
        `User successfully logged in: ${profileData.first_name} ${profileData.last_name}`,
        'authentication',
        authData.user.id
      );

      console.log('Secure login successful for:', profileData.first_name, profileData.last_name);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${profileData.first_name} ${profileData.last_name}!`,
      });

      // The NavigationWrapper will handle the redirect based on user type
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Enhanced error logging
      await auditLogger.logSecurityEvent(
        'login_error',
        `Login error: ${error.message}`,
        'medium'
      );
      
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
        <p className="text-muted-foreground">Enhanced security login with comprehensive monitoring</p>
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
