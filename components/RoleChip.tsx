import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

const roleChipClassMap: Record<UserRole, string> = {
  admin: 'gradient-primary text-white border-0',
  editor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/30',
  viewer: 'bg-muted text-muted-foreground border border-border/30',
};

type RoleChipProps = {
  role: UserRole;
  className?: string;
};

export function RoleChip({ role, className }: RoleChipProps) {
  return (
    <Badge className={cn(roleChipClassMap[role], className)}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}
