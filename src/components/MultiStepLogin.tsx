
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CollegeValidation } from './auth/CollegeValidation';
import { LoginCredentials } from './auth/LoginCredentials';

type LoginStep = 'college' | 'credentials';

const MultiStepLogin = () => {
  const [step, setStep] = useState<LoginStep>('college');
  const [collegeData, setCollegeData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  const handleCollegeValidated = (validatedCollegeData: any) => {
    setCollegeData(validatedCollegeData);
    setStep('credentials');
  };

  const handleLogin = (userData: any) => {
    toast({
      title: 'Login Successful',
      description: `Welcome back, ${userData.first_name}!`,
    });

    // Navigate based on user type
    switch (userData.user_type) {
      case 'student':
        navigate('/student');
        break;
      case 'faculty':
        navigate('/faculty');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'parent':
        navigate('/parent');
        break;
      case 'alumni':
        navigate('/alumni');
        break;
      default:
        navigate('/');
    }
  };

  const handleBack = () => {
    setStep('college');
    setCollegeData(null);
  };

  if (session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Already Logged In</h2>
          <p className="text-muted-foreground">You are already logged in. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      {step === 'college' ? (
        <CollegeValidation onValidated={handleCollegeValidated} />
      ) : (
        <LoginCredentials 
          collegeData={collegeData}
          onLogin={handleLogin}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default MultiStepLogin;
