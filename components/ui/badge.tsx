import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-1 focus-visible:ring-ring transition-colors overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-primary/20 bg-primary/10 text-primary',
        secondary:
          'border-border bg-muted text-muted-foreground',
        destructive:
          'border-destructive/20 bg-destructive/10 text-destructive',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
