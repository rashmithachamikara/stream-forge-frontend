import { UserRole } from '@/features/auth/types';

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
  admin: 'border-primary/20 bg-primary/10 text-primary',
  editor: 'border-warning/20 bg-warning/10 text-warning-foreground',
  viewer: 'border-border bg-muted text-muted-foreground',
};
