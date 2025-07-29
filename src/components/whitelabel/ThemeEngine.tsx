
import React, { useEffect, useMemo } from 'react';
import { useCollegeConfiguration } from '@/hooks/useCollegeConfiguration';

interface ThemeEngineProps {
  children: React.ReactNode;
}

export const ThemeEngine: React.FC<ThemeEngineProps> = ({ children }) => {
  const { collegeConfig } = useCollegeConfiguration();

  const cssVariables = useMemo(() => {
    if (!collegeConfig) return {};

    const { theme } = collegeConfig;
    return {
      '--primary': theme.primaryColor,
      '--secondary': theme.secondaryColor,
      '--accent': theme.accentColor,
      '--font-family': theme.fontFamily,
    } as React.CSSProperties;
  }, [collegeConfig]);

  const customCSS = useMemo(() => {
    if (!collegeConfig?.theme.customCSS) return '';
    
    // Sanitize CSS to prevent XSS
    return collegeConfig.theme.customCSS
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }, [collegeConfig?.theme.customCSS]);

  useEffect(() => {
    if (collegeConfig?.theme.faviconUrl) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = collegeConfig.theme.faviconUrl;
      }
    }

    if (collegeConfig?.name) {
      document.title = `${collegeConfig.name} - ColCord`;
    }
  }, [collegeConfig]);

  return (
    <div 
      className="theme-wrapper min-h-screen"
      style={cssVariables}
      data-college={collegeConfig?.code}
      data-theme={collegeConfig?.customizations.colorScheme}
      data-density={collegeConfig?.customizations.density}
    >
      {customCSS && (
        <style dangerouslySetInnerHTML={{ __html: customCSS }} />
      )}
      
      <style>
        {`
          :root {
            --college-primary: ${collegeConfig?.theme.primaryColor || '#1e40af'};
            --college-secondary: ${collegeConfig?.theme.secondaryColor || '#3b82f6'};
            --college-accent: ${collegeConfig?.theme.accentColor || '#10b981'};
          }
          
          .theme-wrapper {
            font-family: ${collegeConfig?.theme.fontFamily || 'Inter, system-ui, sans-serif'};
          }
          
          .btn-primary {
            background-color: var(--college-primary);
            border-color: var(--college-primary);
          }
          
          .btn-secondary {
            background-color: var(--college-secondary);
            border-color: var(--college-secondary);
          }
          
          .text-primary {
            color: var(--college-primary);
          }
          
          .bg-primary {
            background-color: var(--college-primary);
          }
          
          .border-primary {
            border-color: var(--college-primary);
          }
          
          [data-density="compact"] {
            --spacing-multiplier: 0.75;
          }
          
          [data-density="spacious"] {
            --spacing-multiplier: 1.25;
          }
          
          [data-density="comfortable"] {
            --spacing-multiplier: 1;
          }
        `}
      </style>
      
      {children}
    </div>
  );
};
