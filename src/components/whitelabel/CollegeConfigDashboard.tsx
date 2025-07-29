
import React, { useState } from 'react';
import { useCollegeConfiguration } from '@/hooks/useCollegeConfiguration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilder } from './PageBuilder';
import { Badge } from '@/components/ui/badge';
import { Palette, Layout, Settings, Blocks } from 'lucide-react';

export const CollegeConfigDashboard = () => {
  const { collegeConfig, updateTheme, updateBranding, toggleModule, updateFeature } = useCollegeConfiguration();
  const [activeTab, setActiveTab] = useState('theme');

  if (!collegeConfig) {
    return <div>Loading configuration...</div>;
  }

  const handleThemeUpdate = async (field: string, value: string) => {
    try {
      await updateTheme({ [field]: value });
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const handleBrandingUpdate = async (field: string, value: string) => {
    try {
      await updateBranding({ [field]: value });
    } catch (error) {
      console.error('Failed to update branding:', error);
    }
  };

  return (
    <div className="h-full">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">College Configuration</h1>
        <p className="text-gray-600">Customize your college's ColCord experience</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Blocks className="h-4 w-4" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="theme" className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <ColorPicker
                    value={collegeConfig.theme.primaryColor}
                    onChange={(value) => handleThemeUpdate('primaryColor', value)}
                  />
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <ColorPicker
                    value={collegeConfig.theme.secondaryColor}
                    onChange={(value) => handleThemeUpdate('secondaryColor', value)}
                  />
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <ColorPicker
                    value={collegeConfig.theme.accentColor}
                    onChange={(value) => handleThemeUpdate('accentColor', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={collegeConfig.theme.logoUrl}
                  onChange={(e) => handleThemeUpdate('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Input
                  id="welcomeMessage"
                  value={collegeConfig.branding.welcomeMessage}
                  onChange={(e) => handleBrandingUpdate('welcomeMessage', e.target.value)}
                  placeholder="Welcome to our college portal"
                />
              </div>
              <div>
                <Label htmlFor="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  value={collegeConfig.branding.footerText}
                  onChange={(e) => handleBrandingUpdate('footerText', e.target.value)}
                  placeholder="© 2024 College Name. All rights reserved."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="h-full">
          <PageBuilder />
        </TabsContent>

        <TabsContent value="modules" className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(collegeConfig.modules).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <Badge variant={enabled ? 'default' : 'secondary'}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => toggleModule(key as any, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(collegeConfig.features).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <Badge variant={enabled ? 'default' : 'secondary'}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => updateFeature(key as any, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="collegeName">College Name</Label>
                <Input
                  id="collegeName"
                  value={collegeConfig.name}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="collegeCode">College Code</Label>
                <Input
                  id="collegeCode"
                  value={collegeConfig.code}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
