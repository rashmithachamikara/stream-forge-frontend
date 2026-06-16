import * as React from 'react'

import { cn } from '@/shared/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'bg-muted flex field-sizing-content min-h-16 w-full rounded-md border border-transparent px-3 py-2 text-sm outline-none transition-[background-color,box-shadow] duration-150 focus:bg-background focus:ring-1 focus:ring-ring aria-invalid:ring-1 aria-invalid:ring-destructive disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
