import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';

export function PortalPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('mx-auto flex w-full max-w-[1480px] flex-col gap-8', className)}>{children}</div>;
}

export function PortalHero({
  kicker,
  title,
  description,
  aside,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  aside?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="portal-panel portal-grid relative overflow-hidden rounded-[1.75rem] px-6 py-8 md:px-8 md:py-10">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
        <div className="space-y-5">
          {kicker ? <p className="portal-kicker">{kicker}</p> : null}
          <div className="space-y-3">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-foreground text-balance md:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty md:text-lg">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="grid gap-3">{aside}</div> : null}
      </div>
    </section>
  );
}

export function PortalStatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function PortalStatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="portal-stat rounded-[1.5rem] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">{value}</p>
        </div>
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

export function PortalSectionHeader({
  kicker,
  title,
  description,
  actionLabel,
  onAction,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/70 pb-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {kicker ? <p className="portal-kicker">{kicker}</p> : null}
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button variant="outline" className="gap-2 bg-transparent" onClick={onAction}>
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export function PortalEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="portal-panel rounded-[1.5rem] px-6 py-12 text-center">
      <div className="mx-auto max-w-lg space-y-3">
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
