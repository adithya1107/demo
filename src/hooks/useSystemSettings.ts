
import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { apiGateway } from '@/utils/apiGateway';

export interface SystemSetting {
  id: string;
  college_id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollegeTheme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  favicon_url: string;
  font_family: string;
  custom_css: string;
}

export interface CollegeConfiguration {
  college_name: string;
  college_code: string;
  theme: CollegeTheme;
  enabled_modules: string[];
  custom_branding: {
    header_logo: string;
    login_background: string;
    footer_text: string;
  };
  feature_flags: Record<string, boolean>;
  integrations: Record<string, any>;
}

export const useSystemSettings = () => {
  const { profile } = useUserProfile();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [configuration, setConfiguration] = useState<CollegeConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.college_id) {
      fetchSettings();
    }
  }, [profile?.college_id]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const response = await apiGateway.select('system_settings', {
        filters: { college_id: profile?.college_id },
        order: { column: 'setting_key', ascending: true }
      });

      if (response.success && response.data) {
        const settingsData = response.data as SystemSetting[];
        setSettings(settingsData);
        
        // Build configuration object from settings
        const config: CollegeConfiguration = {
          college_name: '',
          college_code: '',
          theme: {
            primary_color: '#1e40af',
            secondary_color: '#3b82f6',
            accent_color: '#10b981',
            logo_url: '',
            favicon_url: '',
            font_family: 'Inter',
            custom_css: ''
          },
          enabled_modules: [],
          custom_branding: {
            header_logo: '',
            login_background: '',
            footer_text: ''
          },
          feature_flags: {},
          integrations: {}
        };

        settingsData.forEach(setting => {
          const keys = setting.setting_key.split('.');
          let current: any = config;
          
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = setting.setting_value;
        });

        setConfiguration(config);
      } else {
        setError(response.error || 'Failed to fetch settings');
      }
    } catch (err) {
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any, type: SystemSetting['setting_type'] = 'json', isPublic: boolean = false) => {
    try {
      const existingSetting = settings.find(s => s.setting_key === key);
      
      if (existingSetting) {
        const response = await apiGateway.update('system_settings', 
          { setting_value: value, setting_type: type, is_public: isPublic },
          { id: existingSetting.id }
        );
        
        if (response.success) {
          await fetchSettings();
          return { success: true, data: response.data };
        }
        
        return { success: false, error: response.error };
      } else {
        const response = await apiGateway.insert('system_settings', {
          college_id: profile?.college_id || '',
          setting_key: key,
          setting_value: value,
          setting_type: type,
          is_public: isPublic
        });
        
        if (response.success) {
          await fetchSettings();
          return { success: true, data: response.data };
        }
        
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update setting' };
    }
  };

  const updateTheme = async (theme: Partial<CollegeTheme>) => {
    try {
      const promises = Object.entries(theme).map(([key, value]) => 
        updateSetting(`theme.${key}`, value, 'string', true)
      );
      
      const results = await Promise.all(promises);
      const hasError = results.some(r => !r.success);
      
      if (hasError) {
        return { success: false, error: 'Failed to update some theme settings' };
      }
      
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to update theme' };
    }
  };

  const toggleModule = async (moduleName: string, enabled: boolean) => {
    try {
      const currentModules = configuration?.enabled_modules || [];
      const updatedModules = enabled 
        ? [...currentModules, moduleName]
        : currentModules.filter(m => m !== moduleName);
      
      return await updateSetting('enabled_modules', updatedModules, 'array');
    } catch (err) {
      return { success: false, error: 'Failed to toggle module' };
    }
  };

  const updateFeatureFlag = async (flagName: string, enabled: boolean) => {
    try {
      const currentFlags = configuration?.feature_flags || {};
      const updatedFlags = { ...currentFlags, [flagName]: enabled };
      
      return await updateSetting('feature_flags', updatedFlags, 'json');
    } catch (err) {
      return { success: false, error: 'Failed to update feature flag' };
    }
  };

  const getSetting = (key: string, defaultValue?: any) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const getPublicSettings = () => {
    return settings.filter(s => s.is_public);
  };

  return {
    settings,
    configuration,
    loading,
    error,
    updateSetting,
    updateTheme,
    toggleModule,
    updateFeatureFlag,
    getSetting,
    getPublicSettings,
    refetch: fetchSettings
  };
};
