import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const MultiStepLogin = () => {
  const [step, setStep] = useState<'college' | 'login' | 'signup'>('college');
  const [collegeCode, setCollegeCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    userCode: '',
    userType: '',
    email: '',
    password: '',
  });

  const handleCollegeValidation = async () => {
    setLoading(true);
    // Basic validation - can be enhanced with API call to validate college code
    setTimeout(() => {
      if (collegeCode.trim() === '') {
        toast({
          title: 'Error',
          description: 'Please enter a college code.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // For demonstration, proceed to the next step if the code is not empty
      setStep('login');
      setLoading(false);
    }, 1000);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signupData.email,
        password: password,
      });

      if (error) {
        toast({
          title: 'Authentication Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Fetch user profile after successful login
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user?.id)
          .single();

        if (profileError) {
          toast({
            title: 'Profile Error',
            description: profileError.message,
            variant: 'destructive',
          });
        } else if (profileData) {
          // Store user data in local storage
          localStorage.setItem('colcord_user', JSON.stringify(profileData));

          // Redirect based on user type
          switch (profileData.user_type) {
            case 'student':
              navigate('/student');
              break;
            case 'teacher':
              navigate('/teacher');
              break;
            case 'parent':
              navigate('/parent');
              break;
            case 'alumni':
              navigate('/alumni');
              break;
            default:
              toast({
                title: 'Unknown User Type',
                description: 'Please contact support.',
                variant: 'destructive',
              });
          }
        } else {
          toast({
            title: 'Profile Not Found',
            description: 'Please contact support.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Login Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            user_code: signupData.userCode,
            user_type: signupData.userType,
          },
        },
      });

      if (error) {
        toast({
          title: 'Signup Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Insert user profile into user_profiles table
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: data.user?.id,
              first_name: signupData.firstName,
              last_name: signupData.lastName,
              user_code: signupData.userCode,
              user_type: signupData.userType,
              email: signupData.email,
            },
          ]);

        if (profileError) {
          toast({
            title: 'Profile Creation Error',
            description: profileError.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Account Created',
            description: 'Your account has been created successfully. Please sign in.',
          });
          setStep('login');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Signup Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSupport = () => {
    toast({
      title: 'Contact Support',
      description: 'For assistance, please email: support@colcord.edu or call: +91-9876543210',
    });
  };

  useEffect(() => {
    // You can add any initialization logic here
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">ColCord</h1>
        <p className="text-muted-foreground">College Coordination System</p>
      </div>

      {step === 'college' && (
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-card-foreground">College Access</CardTitle>
            <CardDescription>Enter your college code to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="college-code" className="text-card-foreground">College Code</Label>
              <Input
                id="college-code"
                type="text"
                placeholder="Enter your college code"
                value={collegeCode}
                onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                className="bg-background/50 border-white/20 text-card-foreground placeholder:text-muted-foreground"
                disabled={loading}
              />
            </div>
            
            <Button 
              onClick={handleCollegeValidation} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading || !collegeCode.trim()}
            >
              {loading ? 'Validating...' : 'Continue'}
            </Button>

            <div className="text-center">
              <Button 
                variant="link" 
                onClick={handleSupport}
                className="text-sm text-muted-foreground hover:text-card-foreground"
              >
                Need assistance? Contact support
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'login' && (
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost" 
                size="icon"
                onClick={() => setStep('college')}
                className="h-8 w-8 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-xl text-card-foreground">User Verification</CardTitle>
                <CardDescription>Enter your credentials to access your portal</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-code" className="text-card-foreground">User Code</Label>
              <Input
                id="user-code"
                type="text"
                placeholder="Enter your user code"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="bg-background/50 border-white/20 text-card-foreground placeholder:text-muted-foreground"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-card-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-white/20 text-card-foreground placeholder:text-muted-foreground pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading || !userCode.trim() || !password.trim()}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center space-y-2">
              <Button 
                variant="link" 
                onClick={() => setStep('signup')}
                className="text-sm text-muted-foreground hover:text-card-foreground"
              >
                Create new account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'signup' && (
        <Card className="border-white/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost" 
                size="icon"
                onClick={() => setStep('login')}
                className="h-8 w-8 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-xl text-card-foreground">Create Account</CardTitle>
                <CardDescription>Fill in your details to create a new account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name" className="text-card-foreground">First Name</Label>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="First name"
                  value={signupData.firstName}
                  onChange={(e) => setSignupData({...signupData, firstName: e.target.value})}
                  className="bg-background/50 border-white/20 text-card-foreground placeholder:text-muted-foreground"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name" className="text-card-foreground">Last Name</Label>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Last name"
                  value={signupData.lastName}
                  onChange={(e) => setSignupData({...signupData, lastName: e.target.value})}
                  className="bg-background/50 border-white/20 text-card-foreground placeholder:text-muted-foreground"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-user-code" className="text-card-foreground">User Code</Label>
              <Input
                id="signup-user-code"
                type="text"
                placeholder="Enter your desired user code"
                value={signupData.userCode}
                onChange={(e) => setSignupData({...signupData, userCode: e.target.value})}
                className="bg-background/50 border-white/20 text-card-foreground placeholder:text-muted-foreground"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-type" className="text-card-foreground">User Type</Label>
              <Select 
                value={signupData.userType} 
                onValueChange={(value) => setSignupData({...signupData, userType: value})}
                disabled={loading}
              >
                <SelectTrigger className="bg-background/50 border-white/20 text-card-foreground">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-card-foreground">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={signupData.email}
                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                className="bg-background/50 border-white/20 text-card-foreground placeholder:text-muted-foreground"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-card-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                  className="bg-background/50 border-white/20 text-card-foreground placeholder:text-muted-foreground pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleSignup} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading || !signupData.firstName.trim() || !signupData.lastName.trim() || 
                       !signupData.userCode.trim() || !signupData.userType || 
                       !signupData.email.trim() || !signupData.password.trim()}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultiStepLogin;
