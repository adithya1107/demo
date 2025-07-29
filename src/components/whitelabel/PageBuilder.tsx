
import React, { useState, useEffect } from 'react';
import { BlockRegistry, BlockInstance, PageLayout } from '@/lib/blocks/BlockRegistry';
import { useCollegeConfiguration } from '@/hooks/useCollegeConfiguration';
import { BlockRenderer } from './BlockRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, Eye, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PageBuilderProps {
  pageId?: string;
  onSave?: (layout: PageLayout) => void;
}

export const PageBuilder: React.FC<PageBuilderProps> = ({ pageId, onSave }) => {
  const { collegeConfig, savePageLayout } = useCollegeConfiguration();
  const registry = BlockRegistry.getInstance();
  
  const [currentLayout, setCurrentLayout] = useState<PageLayout>({
    id: pageId || `page-${Date.now()}`,
    name: 'New Page',
    route: '/',
    userTypes: ['student'],
    blocks: [],
    isDefault: false,
    isActive: true
  });

  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<BlockInstance | null>(null);
  const [availableBlocks, setAvailableBlocks] = useState<any[]>([]);

  useEffect(() => {
    const blocks = registry.getAllBlocks();
    setAvailableBlocks(blocks);
  }, []);

  const handleAddBlock = (blockId: string) => {
    const blockConfig = registry.getBlock(blockId);
    if (!blockConfig) return;

    const newInstance: BlockInstance = {
      id: `instance-${Date.now()}`,
      blockId,
      props: { ...blockConfig.defaultProps },
      position: { x: 0, y: 0, w: 1, h: 1 },
      isVisible: true,
      permissions: blockConfig.permissions
    };

    setCurrentLayout(prev => ({
      ...prev,
      blocks: [...prev.blocks, newInstance]
    }));
  };

  const handleEditBlock = (instance: BlockInstance) => {
    setSelectedBlock(instance);
  };

  const handleDeleteBlock = (instanceId: string) => {
    setCurrentLayout(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== instanceId)
    }));
  };

  const handleSaveLayout = async () => {
    try {
      await savePageLayout(currentLayout);
      onSave?.(currentLayout);
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  const handleUpdateBlockProps = (instanceId: string, props: Record<string, any>) => {
    setCurrentLayout(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === instanceId ? { ...block, props } : block
      )
    }));
  };

  return (
    <div className="h-full flex">
      {/* Sidebar - Block Library */}
      <div className="w-80 border-r bg-gray-50 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Block Library</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? <Eye className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
            </Button>
          </div>

          <Tabs defaultValue="blocks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blocks">Blocks</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="space-y-4">
              {registry.getCategories().map(category => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {registry.getBlocksByCategory(category).map(block => (
                      <div
                        key={block.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleAddBlock(block.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{block.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {block.version}
                          </Badge>
                        </div>
                        <Plus className="h-4 w-4" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="pageName">Page Name</Label>
                    <Input
                      id="pageName"
                      value={currentLayout.name}
                      onChange={(e) => setCurrentLayout(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pageRoute">Route</Label>
                    <Input
                      id="pageRoute"
                      value={currentLayout.route}
                      onChange={(e) => setCurrentLayout(prev => ({ ...prev, route: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="userTypes">User Types</Label>
                    <Select
                      value={currentLayout.userTypes[0] || ''}
                      onValueChange={(value) => setCurrentLayout(prev => ({ ...prev, userTypes: [value] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="alumni">Alumni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{currentLayout.name}</h2>
            <p className="text-sm text-gray-600">Route: {currentLayout.route}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditMode(!isEditMode)}>
              {isEditMode ? 'Preview' : 'Edit'}
            </Button>
            <Button onClick={handleSaveLayout}>
              <Save className="h-4 w-4 mr-2" />
              Save Layout
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div className="grid grid-cols-12 gap-4 auto-rows-min">
            {currentLayout.blocks.map(block => (
              <BlockRenderer
                key={block.id}
                instance={block}
                isEditMode={isEditMode}
                onEdit={handleEditBlock}
                onDelete={handleDeleteBlock}
              />
            ))}
          </div>
          
          {currentLayout.blocks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No blocks added yet. Select blocks from the library to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Block Properties Panel */}
      {selectedBlock && (
        <Dialog open={!!selectedBlock} onOpenChange={() => setSelectedBlock(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block Properties</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Configure properties for: {registry.getBlock(selectedBlock.blockId)?.name}</p>
              {/* Add dynamic form fields based on block configuration */}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
