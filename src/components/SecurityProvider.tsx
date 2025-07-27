
import React, { createContext, useContext, useEffect, useState } from 'react';
import { RateLimiter } from '@/utils/security';

interface SecurityContextType {
  rateLimiter: RateLimiter;
  isSecurityEnabled: boolean;
  reportSecurityViolation: (violation: string, details?: any) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [rateLimiter] = useState(() => new RateLimiter(5, 15 * 60 * 1000)); // 5 attempts per 15 minutes
  const [isSecurityEnabled] = useState(true);

  const reportSecurityViolation = (violation: string, details?: any) => {
    console.warn('Security Violation:', violation, details);
    
    // In production, you would send this to your security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to security monitoring endpoint
      fetch('/api/security/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          violation,
          details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(error => {
        console.error('Failed to report security violation:', error);
      });
    }
  };

  useEffect(() => {
    // Set up Content Security Policy
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Note: In production, use nonces instead of unsafe-inline
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
    
    document.head.appendChild(meta);

    // Set up security headers via meta tags
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];

    securityHeaders.forEach(header => {
      const metaTag = document.createElement('meta');
      metaTag.name = header.name;
      metaTag.content = header.content;
      document.head.appendChild(metaTag);
    });

    // Security event listeners
    const handleSecurityViolation = (event: SecurityPolicyViolationEvent) => {
      reportSecurityViolation('CSP Violation', {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        effectiveDirective: event.effectiveDirective
      });
    };

    document.addEventListener('securitypolicyviolation', handleSecurityViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleSecurityViolation);
    };
  }, []);

  return (
    <SecurityContext.Provider value={{
      rateLimiter,
      isSecurityEnabled,
      reportSecurityViolation
    }}>
      {children}
    </SecurityContext.Provider>
  );
};
