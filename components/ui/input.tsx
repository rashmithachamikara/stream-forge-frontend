import * as React from 'react'

import { cn } from '@/shared/lib/utils'

function Input({ className, type, style, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border border-input bg-input/80 px-3 py-2 text-base text-foreground shadow-sm outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-placeholder disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'transition-[border-color,box-shadow,background-color] duration-200 ease-in-out',
        'focus:border-primary! focus:bg-secondary/50 focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_24%,transparent)]!',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      style={{
        ...style,
        // @ts-ignore - CSS variables work fine
        '--placeholder-color': 'hsl(var(--placeholder))',
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Input }
