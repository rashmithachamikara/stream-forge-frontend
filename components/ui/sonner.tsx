'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast border border-border bg-popover text-popover-foreground shadow-lg rounded-md font-sans text-xs',
          success:
            'border-success/20 bg-success/10 text-success [&>[data-icon]]:text-success',
          error:
            'border-destructive/20 bg-destructive/10 text-destructive [&>[data-icon]]:text-destructive',
          warning:
            'border-warning/20 bg-warning/10 text-warning [&>[data-icon]]:text-warning',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
