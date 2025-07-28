
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { securityMonitor } from '@/utils/securityMonitor';

interface SecurityContextType {
  reportSecurityViolation: (violation: string, metadata?: any) => void;
  getSecurityMetrics: () => any;
  isSecurityEnabled: boolean;
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
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [isSecurityEnabled, setIsSecurityEnabled] = useState(true);

  const reportSecurityViolation = (violation: string, metadata?: any) => {
    securityMonitor.reportThreat({
      type: 'suspicious_activity',
      severity: 'medium',
      description: violation,
      blocked: false,
      metadata
    });
  };

  const getSecurityMetrics = () => {
    return securityMonitor.getMetrics();
  };

  const value: SecurityContextType = {
    reportSecurityViolation,
    getSecurityMetrics,
    isSecurityEnabled
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};
