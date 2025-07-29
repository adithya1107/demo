
import React from 'react';
import { BlockRegistry, BlockInstance } from '@/lib/blocks/BlockRegistry';
import { usePermissions } from '@/hooks/usePermissions';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface BlockRendererProps {
  instance: BlockInstance;
  isEditMode?: boolean;
  onEdit?: (instance: BlockInstance) => void;
  onDelete?: (instanceId: string) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  instance,
  isEditMode = false,
  onEdit,
  onDelete
}) => {
  const { permissions } = usePermissions();
  const registry = BlockRegistry.getInstance();

  const blockConfig = registry.getBlock(instance.blockId);

  if (!blockConfig) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Block "{instance.blockId}" not found
        </AlertDescription>
      </Alert>
    );
  }

  // Check permissions
  if (!registry.validateBlockPermissions(instance.blockId, permissions)) {
    return null;
  }

  if (!instance.isVisible) {
    return null;
  }

  const BlockComponent = blockConfig.component;

  const blockElement = (
    <div 
      className="block-instance"
      data-block-id={instance.blockId}
      data-instance-id={instance.id}
      style={{
        gridColumn: `span ${instance.position.w}`,
        gridRow: `span ${instance.position.h}`,
      }}
    >
      <BlockComponent {...instance.props} />
    </div>
  );

  if (isEditMode) {
    return (
      <Card className="relative border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <button
            onClick={() => onEdit?.(instance)}
            className="px-2 py-1 bg-primary text-white rounded text-xs hover:bg-primary/80"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete?.(instance.id)}
            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            Delete
          </button>
        </div>
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-1 bg-gray-900 text-white rounded text-xs">
            {blockConfig.name}
          </span>
        </div>
        <div className="p-4">
          {blockElement}
        </div>
      </Card>
    );
  }

  return blockElement;
};
