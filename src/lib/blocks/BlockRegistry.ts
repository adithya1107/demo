
export interface BlockConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
  configSchema?: Record<string, any>;
  permissions?: string[];
  dependencies?: string[];
  isSystem?: boolean;
  isCustomizable?: boolean;
  version: string;
}

export interface BlockInstance {
  id: string;
  blockId: string;
  props: Record<string, any>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  isVisible: boolean;
  permissions?: string[];
}

export interface PageLayout {
  id: string;
  name: string;
  route: string;
  userTypes: string[];
  blocks: BlockInstance[];
  isDefault: boolean;
  isActive: boolean;
}

export class BlockRegistry {
  private static instance: BlockRegistry;
  private blocks: Map<string, BlockConfig> = new Map();
  private categories: Map<string, string> = new Map();

  static getInstance(): BlockRegistry {
    if (!BlockRegistry.instance) {
      BlockRegistry.instance = new BlockRegistry();
    }
    return BlockRegistry.instance;
  }

  registerBlock(block: BlockConfig): void {
    this.blocks.set(block.id, block);
    this.categories.set(block.category, block.category);
  }

  getBlock(blockId: string): BlockConfig | undefined {
    return this.blocks.get(blockId);
  }

  getBlocksByCategory(category: string): BlockConfig[] {
    return Array.from(this.blocks.values()).filter(
      block => block.category === category
    );
  }

  getAllBlocks(): BlockConfig[] {
    return Array.from(this.blocks.values());
  }

  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  validateBlockPermissions(blockId: string, userPermissions: string[]): boolean {
    const block = this.getBlock(blockId);
    if (!block || !block.permissions) return true;
    
    return block.permissions.every(permission => 
      userPermissions.includes(permission)
    );
  }

  checkBlockDependencies(blockId: string, enabledBlocks: string[]): boolean {
    const block = this.getBlock(blockId);
    if (!block || !block.dependencies) return true;
    
    return block.dependencies.every(dep => enabledBlocks.includes(dep));
  }
}
