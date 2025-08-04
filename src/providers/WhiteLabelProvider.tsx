import React, { createContext, useContext, useEffect } from 'react';
import { ThemeEngine } from '@/components/whitelabel/ThemeEngine';
import { useCollegeConfiguration } from '@/hooks/useCollegeConfiguration';
import { registerDefaultBlocks } from '@/lib/blocks/defaultBlocks';

interface WhiteLabelContextType {
  collegeConfig: any;
  isConfigured: boolean;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

export const useWhiteLabel = () => {
  const context = useContext(WhiteLabelContext);
  if (!context) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
};

interface WhiteLabelProviderProps {
  children: React.ReactNode;
}

export const WhiteLabelProvider: React.FC<WhiteLabelProviderProps> = ({ children }) => {
  const { collegeConfig, loading } = useCollegeConfiguration();

  useEffect(() => {
    console.log('🧩 Registering default blocks from WhiteLabelProvider');
    registerDefaultBlocks();
  }, []);

  // Debug current state
  console.log('🏷️ WhiteLabelProvider render:', { loading, hasConfig: !!collegeConfig });

  // DON'T BLOCK - always render children
  const contextValue: WhiteLabelContextType = {
    collegeConfig: collegeConfig || {},
    isConfigured: !!collegeConfig
  };

  return (
    <WhiteLabelContext.Provider value={contextValue}>
      <ThemeEngine>
        {children}
      </ThemeEngine>
    </WhiteLabelContext.Provider>
  );
};