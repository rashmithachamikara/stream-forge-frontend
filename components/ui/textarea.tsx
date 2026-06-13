import * as React from 'react'

import { cn } from '@/shared/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-20 w-full rounded-lg border border-input bg-input/80 px-3 py-2 text-base text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-placeholder focus-visible:border-ring focus-visible:bg-secondary/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/30 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
