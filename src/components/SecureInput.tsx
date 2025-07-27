
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
      
      // Check for potentially malicious input
      const maliciousPatterns = [
        /<script/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /document\./gi,
        /window\./gi,
        /location\./gi,
        /cookie/gi,
        /localStorage/gi,
        /sessionStorage/gi
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
        
        // Prevent the malicious input from being processed
        return;
      }

      // Sanitize the input
      let sanitizedValue = sanitizeInput(rawValue, maxLength);

      // Apply character restrictions if specified
      if (allowedChars && !allowedChars.test(sanitizedValue)) {
        sanitizedValue = sanitizedValue.replace(new RegExp(`[^${allowedChars.source}]`, 'g'), '');
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
          className={`${props.className} ${hasSecurityWarning ? 'border-red-500 bg-red-50' : ''}`}
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
