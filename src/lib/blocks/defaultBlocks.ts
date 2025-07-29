
import { BlockRegistry } from './BlockRegistry';
import { BLOCK_CATEGORIES } from './BlockCategories';

// Import existing components
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import SmartDashboard from '@/components/dashboard/SmartDashboard';
import StudentDashboard from '@/components/student/StudentDashboard';
import TeacherDashboard from '@/components/teacher/TeacherDashboard';
import ParentDashboard from '@/components/parent/ParentDashboard';

// Register all existing blocks
export const registerDefaultBlocks = () => {
  const registry = BlockRegistry.getInstance();

  // Dashboard Blocks
  registry.registerBlock({
    id: 'dashboard-widget',
    name: 'Dashboard Widget',
    description: 'A customizable dashboard widget displaying key metrics',
    category: BLOCK_CATEGORIES.DASHBOARD,
    icon: 'BarChart',
    component: DashboardWidget,
    defaultProps: {
      title: 'Widget Title',
      value: '0',
      color: 'text-blue-600'
    },
    configSchema: {
      title: { type: 'string', label: 'Widget Title' },
      value: { type: 'string', label: 'Value' },
      color: { type: 'color', label: 'Color' }
    },
    permissions: ['dashboard'],
    version: '1.0.0'
  });

  registry.registerBlock({
    id: 'smart-dashboard',
    name: 'Smart Dashboard',
    description: 'Intelligent dashboard that adapts to user role',
    category: BLOCK_CATEGORIES.DASHBOARD,
    icon: 'Layout',
    component: SmartDashboard,
    defaultProps: {},
    permissions: ['dashboard'],
    isSystem: true,
    version: '1.0.0'
  });

  registry.registerBlock({
    id: 'student-dashboard',
    name: 'Student Dashboard',
    description: 'Dedicated dashboard for students',
    category: BLOCK_CATEGORIES.DASHBOARD,
    icon: 'GraduationCap',
    component: StudentDashboard,
    defaultProps: {},
    permissions: ['dashboard'],
    version: '1.0.0'
  });

  registry.registerBlock({
    id: 'teacher-dashboard',
    name: 'Teacher Dashboard',
    description: 'Dedicated dashboard for teachers',
    category: BLOCK_CATEGORIES.DASHBOARD,
    icon: 'Users',
    component: TeacherDashboard,
    defaultProps: {},
    permissions: ['dashboard'],
    version: '1.0.0'
  });

  registry.registerBlock({
    id: 'parent-dashboard',
    name: 'Parent Dashboard',
    description: 'Dedicated dashboard for parents',
    category: BLOCK_CATEGORIES.DASHBOARD,
    icon: 'Heart',
    component: ParentDashboard,
    defaultProps: {},
    permissions: ['dashboard'],
    version: '1.0.0'
  });

  // Add more blocks as needed...
  console.log('Default blocks registered successfully');
};
