
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
    // Register all default blocks when the provider initializes
    registerDefaultBlocks();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const contextValue: WhiteLabelContextType = {
    collegeConfig,
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
