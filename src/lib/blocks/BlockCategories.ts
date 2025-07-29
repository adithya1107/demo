
export const BLOCK_CATEGORIES = {
  DASHBOARD: 'dashboard',
  ACADEMIC: 'academic',
  COMMUNICATION: 'communication',
  FINANCE: 'finance',
  CAMPUS_LIFE: 'campus-life',
  ADMIN: 'admin',
  REPORTS: 'reports',
  CONTENT: 'content',
  NAVIGATION: 'navigation',
  WIDGETS: 'widgets'
} as const;

export const CATEGORY_LABELS = {
  [BLOCK_CATEGORIES.DASHBOARD]: 'Dashboard',
  [BLOCK_CATEGORIES.ACADEMIC]: 'Academic',
  [BLOCK_CATEGORIES.COMMUNICATION]: 'Communication',
  [BLOCK_CATEGORIES.FINANCE]: 'Finance',
  [BLOCK_CATEGORIES.CAMPUS_LIFE]: 'Campus Life',
  [BLOCK_CATEGORIES.ADMIN]: 'Administration',
  [BLOCK_CATEGORIES.REPORTS]: 'Reports & Analytics',
  [BLOCK_CATEGORIES.CONTENT]: 'Content Management',
  [BLOCK_CATEGORIES.NAVIGATION]: 'Navigation',
  [BLOCK_CATEGORIES.WIDGETS]: 'Widgets'
} as const;

export const CATEGORY_DESCRIPTIONS = {
  [BLOCK_CATEGORIES.DASHBOARD]: 'Overview and summary blocks for dashboards',
  [BLOCK_CATEGORIES.ACADEMIC]: 'Course management, assignments, and grading',
  [BLOCK_CATEGORIES.COMMUNICATION]: 'Messaging, announcements, and forums',
  [BLOCK_CATEGORIES.FINANCE]: 'Fee management and financial tracking',
  [BLOCK_CATEGORIES.CAMPUS_LIFE]: 'Events, facilities, and campus activities',
  [BLOCK_CATEGORIES.ADMIN]: 'Administrative tools and management',
  [BLOCK_CATEGORIES.REPORTS]: 'Analytics and reporting capabilities',
  [BLOCK_CATEGORIES.CONTENT]: 'Content creation and management',
  [BLOCK_CATEGORIES.NAVIGATION]: 'Navigation and menu components',
  [BLOCK_CATEGORIES.WIDGETS]: 'General purpose widgets and tools'
} as const;
