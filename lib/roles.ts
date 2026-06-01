import { UserRole } from '@/types';

export type RoleFilter = 'all' | UserRole;

export const USER_ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
];

export const USER_ROLE_FILTER_OPTIONS: Array<{ value: RoleFilter; label: string }> = [
  { value: 'all', label: 'All Roles' },
  ...USER_ROLE_OPTIONS,
];

export const USER_ROLE_LABEL_MAP: Record<UserRole, string> = USER_ROLE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<UserRole, string>
);

export const USER_ROLE_CHIP_CLASS_MAP: Record<UserRole, string> = {
  admin: 'gradient-primary text-white border-0',
  editor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/30',
  viewer: 'bg-muted text-muted-foreground border border-border/30',
};
