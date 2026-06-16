import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/shared/lib/utils';

type InitialsAvatarProps = {
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
};

const getInitials = (name?: string | null) => {
  const displayName = name?.trim() || 'User';

  return displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const InitialsAvatar = ({ name, className, fallbackClassName }: InitialsAvatarProps) => (
  <Avatar className={cn('h-8 w-8', className)}>
    <AvatarFallback className={cn('bg-muted text-foreground font-semibold text-[11px]', fallbackClassName)}>
      {getInitials(name)}
    </AvatarFallback>
  </Avatar>
);
