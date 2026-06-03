'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/shared/lib/utils'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const normalizedValue = Math.min(Math.max(value ?? 0, 0), 100)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full transition-all"
        style={{
          width: `${normalizedValue}%`,
          backgroundColor: 'hsl(var(--chart-5))',
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
