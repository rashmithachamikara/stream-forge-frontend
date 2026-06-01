import { Badge } from '@/components/ui/badge';
import { USER_ROLE_CHIP_CLASS_MAP, USER_ROLE_LABEL_MAP } from '@/shared/lib/roles';
import { cn } from '@/shared/lib/utils';
import { UserRole } from '@/features/auth/types';

type RoleChipProps = {
  role: UserRole;
  className?: string;
};

export function RoleChip({ role, className }: RoleChipProps) {
  return (
    <Badge className={cn(USER_ROLE_CHIP_CLASS_MAP[role], className)}>
      {USER_ROLE_LABEL_MAP[role]}
    </Badge>
  );
}
