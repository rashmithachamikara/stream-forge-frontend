import * as React from 'react'

import { cn } from '@/shared/lib/utils'

function Input({ className, type, style, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/35 border-input h-9 w-full min-w-0 rounded-md border bg-background/70 px-3 py-1 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'shadow-[0_0_0_0px_transparent] transition-[border-color,box-shadow] duration-200 ease-in-out',
        'focus:border-primary/70! focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.16)]!',
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
