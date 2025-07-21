
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  badge?: string | number;
  children?: SidebarItem[];
  disabled?: boolean;
}

interface SidebarGroup {
  id: string;
  label: string;
  items: SidebarItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface EnhancedSidebarNavigationProps {
  groups: SidebarGroup[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
  userType: 'student' | 'teacher' | 'parent' | 'alumni' | 'admin';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const EnhancedSidebarNavigation = ({ 
  groups, 
  activeItem, 
  onItemClick, 
  userType, 
  collapsed = false,
  onToggleCollapse
}: EnhancedSidebarNavigationProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.filter(g => g.defaultExpanded !== false).map(g => g.id))
  );

  const getRoleColor = (userType: string) => {
    switch (userType) {
      case 'student': return 'role-student';
      case 'teacher': return 'role-teacher';
      case 'parent': return 'role-parent';
      case 'alumni': return 'role-alumni';
      case 'admin': return 'role-admin';
      default: return 'primary';
    }
  };

  const roleColor = getRoleColor(userType);

  const toggleGroup = (groupId: string) => {
    if (collapsed) return;
    
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const renderItem = (item: SidebarItem, depth = 0) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.has(item.id);

    const itemContent = (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <Icon className={cn(
            "h-5 w-5 flex-shrink-0", 
            isActive && `text-${roleColor}`,
            item.disabled && "opacity-50"
          )} />
          {!collapsed && (
            <>
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </div>
        {!collapsed && hasChildren && (
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            isExpanded && "rotate-90"
          )} />
        )}
      </div>
    );

    const buttonElement = (
      <button
        onClick={() => {
          if (item.disabled) return;
          if (hasChildren) {
            toggleGroup(item.id);
          } else {
            onItemClick(item.id);
            item.onClick?.();
          }
        }}
        disabled={item.disabled}
        className={cn(
          "w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-left",
          isActive 
            ? `bg-${roleColor}/20 text-${roleColor} border border-${roleColor}/30`
            : "text-muted-foreground hover:bg-white/5 hover:text-card-foreground",
          collapsed && "justify-center",
          item.disabled && "opacity-50 cursor-not-allowed",
          depth > 0 && "ml-6"
        )}
      >
        {itemContent}
      </button>
    );

    const element = collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonElement}
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.label}</p>
          {item.badge && <p className="text-xs">({item.badge})</p>}
        </TooltipContent>
      </Tooltip>
    ) : (
      buttonElement
    );

    return (
      <div key={item.id}>
        {element}
        {!collapsed && hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children?.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "bg-card border-r border-white/10 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header with collapse toggle */}
      <div className="p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Navigation</h2>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        {collapsed && onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0 mx-auto"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {groups.map((group) => {
          const isGroupExpanded = expandedGroups.has(group.id);
          
          return (
            <div key={group.id}>
              {!collapsed && (
                <div className="mb-3">
                  {group.collapsible ? (
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      <span>{group.label}</span>
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform",
                        !isGroupExpanded && "-rotate-90"
                      )} />
                    </button>
                  ) : (
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </h3>
                  )}
                </div>
              )}
              
              {(!collapsed && (!group.collapsible || isGroupExpanded)) && (
                <div className="space-y-1">
                  {group.items.map(item => renderItem(item))}
                </div>
              )}
              
              {collapsed && (
                <div className="space-y-1">
                  {group.items.map(item => renderItem(item))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedSidebarNavigation;
