
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { getPasswordStrength } from '@/utils/passwordSecurity';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password, className = '' }) => {
  const { score, feedback } = getPasswordStrength(password);
  
  if (!password) return null;
  
  const strengthLevel = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
  const strengthColor = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
  }[strengthLevel];
  
  const strengthText = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong'
  }[strengthLevel];
  
  const strengthIcon = {
    weak: <AlertTriangle className="h-4 w-4 text-red-500" />,
    medium: <Shield className="h-4 w-4 text-yellow-500" />,
    strong: <CheckCircle className="h-4 w-4 text-green-500" />
  }[strengthLevel];
  
  const progressValue = (score / 7) * 100;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {strengthIcon}
        <span className="text-sm font-medium">{strengthText}</span>
      </div>
      
      <Progress value={progressValue} className="h-2" />
      
      {feedback.length > 0 && (
        <div className="space-y-1">
          {feedback.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-current rounded-full" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
