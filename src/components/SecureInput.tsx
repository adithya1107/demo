
import React, { forwardRef, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { sanitizeInput } from '@/utils/security';
import { useSecurityContext } from '@/components/SecurityProvider';
import { AlertTriangle } from 'lucide-react';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength?: number;
  allowedChars?: RegExp;
  onSecurityViolation?: (violation: string) => void;
}

const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ 
    onChange, 
    maxLength = 1000, 
    allowedChars,
    onSecurityViolation,
    ...props 
  }, ref) => {
    const { reportSecurityViolation } = useSecurityContext();
    const [hasSecurityWarning, setHasSecurityWarning] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      
      // Only check for extremely malicious patterns, not basic characters
      const maliciousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:\s*[^;]*/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi,
        /eval\s*\(\s*[^)]*\)/gi,
        /document\.write/gi,
        /window\.location\s*=/gi
      ];

      const hasMaliciousContent = maliciousPatterns.some(pattern => 
        pattern.test(rawValue)
      );

      if (hasMaliciousContent) {
        const violation = 'Potentially malicious input detected';
        reportSecurityViolation(violation, { 
          input: rawValue,
          field: props.name || 'unknown'
        });
        
        onSecurityViolation?.(violation);
        setHasSecurityWarning(true);
        
        // Clear the warning after 5 seconds
        setTimeout(() => setHasSecurityWarning(false), 5000);
        
        // Block malicious input but allow normal characters
        return;
      }

      // Light sanitization - only remove null bytes and extreme control characters
      let sanitizedValue = rawValue.replace(/\0/g, '');
      
      // Apply length restriction
      if (sanitizedValue.length > maxLength) {
        sanitizedValue = sanitizedValue.substring(0, maxLength);
      }

      // Apply character restrictions only if specified and value doesn't match
      if (allowedChars && sanitizedValue && !allowedChars.test(sanitizedValue)) {
        // Only filter out characters that don't match, don't clear the entire input
        sanitizedValue = sanitizedValue.split('').filter(char => allowedChars.test(char)).join('');
      }

      // Create a new event with the sanitized value
      const sanitizedEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue
        }
      };

      onChange?.(sanitizedEvent);
    }, [onChange, maxLength, allowedChars, onSecurityViolation, reportSecurityViolation]);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          onChange={handleChange}
          className={`${props.className || ''} ${hasSecurityWarning ? 'border-red-500 bg-red-50' : ''}`}
        />
        {hasSecurityWarning && (
          <div className="absolute -bottom-6 left-0 flex items-center text-xs text-red-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span>Security warning: Input sanitized</span>
          </div>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

export default SecureInput;
