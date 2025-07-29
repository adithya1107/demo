
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
      // Transform system settings to college configuration with proper type mapping
      const config: CollegeConfiguration = {
        id: configuration.college_code,
        name: configuration.college_name,
        code: configuration.college_code,
        theme: {
          primaryColor: configuration.theme?.primary_color || '#3B82F6',
          secondaryColor: configuration.theme?.secondary_color || '#64748B',
          accentColor: configuration.theme?.accent_color || '#F59E0B',
          logoUrl: configuration.theme?.logo_url || '',
          faviconUrl: configuration.theme?.favicon_url || '',
          fontFamily: configuration.theme?.font_family || 'Inter',
          customCSS: configuration.theme?.custom_css || ''
        },
        branding: {
          headerLogo: configuration.custom_branding?.header_logo || '',
          loginBackground: configuration.custom_branding?.login_background || '',
          footerText: configuration.custom_branding?.footer_text || '',
          welcomeMessage: configuration.custom_branding?.welcome_message || 'Welcome to ColCord'
        },
        enabledBlocks: configuration.enabled_modules || [],
        pageLayouts: [], // Will be loaded from system settings
        modules: {
          academic: configuration.enabled_modules?.includes('academic') || false,
          communication: configuration.enabled_modules?.includes('communication') || false,
          finance: configuration.enabled_modules?.includes('finance') || false,
          campusLife: configuration.enabled_modules?.includes('campus-life') || false,
          alumni: configuration.enabled_modules?.includes('alumni') || false,
          hostel: configuration.enabled_modules?.includes('hostel') || false,
          marketplace: configuration.enabled_modules?.includes('marketplace') || false
        },
        features: {
          qrAttendance: configuration.feature_flags?.qr_attendance || false,
          mobileApp: configuration.feature_flags?.mobile_app || false,
          parentPortal: configuration.feature_flags?.parent_portal || false,
          alumniNetwork: configuration.feature_flags?.alumni_network || false,
          certificateGeneration: configuration.feature_flags?.certificate_generation || false,
          bulkOperations: configuration.feature_flags?.bulk_operations || false,
          advancedReporting: configuration.feature_flags?.advanced_reporting || false
        },
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
