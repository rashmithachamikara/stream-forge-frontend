import { Badge } from '@/components/ui/badge';
import { USER_ROLE_CHIP_CLASS_MAP, USER_ROLE_LABEL_MAP } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

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
