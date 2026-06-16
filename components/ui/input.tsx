import * as React from 'react'

import { cn } from '@/shared/lib/utils'

function Input({ className, type, style, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground selection:bg-primary selection:text-primary-foreground bg-muted h-9 w-full min-w-0 rounded-md border border-transparent px-3 py-2 text-sm outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'transition-[background-color,box-shadow] duration-150 ease-in-out',
        'focus:bg-background focus:ring-1 focus:ring-ring',
        'aria-invalid:ring-1 aria-invalid:ring-destructive',
        className,
      )}
      style={style}
      {...props}
    />
  )
}

export { Input }
