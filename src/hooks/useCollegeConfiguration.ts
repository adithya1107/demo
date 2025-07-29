
import { useState, useEffect } from 'react';
import { useSystemSettings } from './useSystemSettings';
import { BlockInstance, PageLayout } from '@/lib/blocks/BlockRegistry';

export interface CollegeConfiguration {
  id: string;
  name: string;
  code: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string;
    faviconUrl: string;
    fontFamily: string;
    customCSS: string;
  };
  branding: {
    headerLogo: string;
    loginBackground: string;
    footerText: string;
    welcomeMessage: string;
  };
  enabledBlocks: string[];
  pageLayouts: PageLayout[];
  modules: {
    academic: boolean;
    communication: boolean;
    finance: boolean;
    campusLife: boolean;
    alumni: boolean;
    hostel: boolean;
    marketplace: boolean;
  };
  features: {
    qrAttendance: boolean;
    mobileApp: boolean;
    parentPortal: boolean;
    alumniNetwork: boolean;
    certificateGeneration: boolean;
    bulkOperations: boolean;
    advancedReporting: boolean;
  };
  customizations: {
    dashboardLayout: string;
    navigationStyle: string;
    colorScheme: string;
    density: 'compact' | 'comfortable' | 'spacious';
  };
}

export const useCollegeConfiguration = () => {
  const { configuration, updateSetting, loading, error } = useSystemSettings();
  const [collegeConfig, setCollegeConfig] = useState<CollegeConfiguration | null>(null);

  useEffect(() => {
    if (configuration) {
      // Transform system settings to college configuration
      const config: CollegeConfiguration = {
        id: configuration.college_code,
        name: configuration.college_name,
        code: configuration.college_code,
        theme: configuration.theme,
        branding: configuration.custom_branding,
        enabledBlocks: configuration.enabled_modules,
        pageLayouts: [], // Will be loaded from system settings
        modules: {
          academic: configuration.enabled_modules.includes('academic'),
          communication: configuration.enabled_modules.includes('communication'),
          finance: configuration.enabled_modules.includes('finance'),
          campusLife: configuration.enabled_modules.includes('campus-life'),
          alumni: configuration.enabled_modules.includes('alumni'),
          hostel: configuration.enabled_modules.includes('hostel'),
          marketplace: configuration.enabled_modules.includes('marketplace')
        },
        features: configuration.feature_flags,
        customizations: {
          dashboardLayout: 'grid',
          navigationStyle: 'sidebar',
          colorScheme: 'auto',
          density: 'comfortable'
        }
      };
      
      setCollegeConfig(config);
    }
  }, [configuration]);

  const updateTheme = async (theme: Partial<CollegeConfiguration['theme']>) => {
    const promises = Object.entries(theme).map(([key, value]) => 
      updateSetting(`theme.${key}`, value, 'string', true)
    );
    
    return Promise.all(promises);
  };

  const updateBranding = async (branding: Partial<CollegeConfiguration['branding']>) => {
    const promises = Object.entries(branding).map(([key, value]) => 
      updateSetting(`branding.${key}`, value, 'string', true)
    );
    
    return Promise.all(promises);
  };

  const toggleModule = async (module: keyof CollegeConfiguration['modules'], enabled: boolean) => {
    const currentModules = collegeConfig?.enabledBlocks || [];
    const updatedModules = enabled 
      ? [...currentModules, module]
      : currentModules.filter(m => m !== module);
    
    return updateSetting('enabled_modules', updatedModules, 'array');
  };

  const updateFeature = async (feature: keyof CollegeConfiguration['features'], enabled: boolean) => {
    return updateSetting(`features.${feature}`, enabled, 'boolean');
  };

  const savePageLayout = async (layout: PageLayout) => {
    const currentLayouts = collegeConfig?.pageLayouts || [];
    const updatedLayouts = currentLayouts.some(l => l.id === layout.id)
      ? currentLayouts.map(l => l.id === layout.id ? layout : l)
      : [...currentLayouts, layout];
    
    return updateSetting('page_layouts', updatedLayouts, 'json');
  };

  const updateCustomization = async (key: keyof CollegeConfiguration['customizations'], value: any) => {
    return updateSetting(`customizations.${key}`, value, 'string');
  };

  return {
    collegeConfig,
    loading,
    error,
    updateTheme,
    updateBranding,
    toggleModule,
    updateFeature,
    savePageLayout,
    updateCustomization
  };
};
