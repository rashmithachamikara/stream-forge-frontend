import React from 'react';
import { LucideIcon, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/12 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground md:text-4xl">{title}</h1>
        </div>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  helper?: React.ReactNode;
}

export function StatTile({ label, value, icon: Icon, helper }: StatTileProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{value}</div>
        {helper ? <div className="mt-2 text-xs text-muted-foreground">{helper}</div> : null}
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function AppEmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('py-12 text-center', className)}>
      <CardContent className="mx-auto max-w-md space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-secondary/70 text-primary">
          <Play className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return (
    <Card className="border-destructive/40 bg-destructive/10">
      <CardContent className="py-4 text-sm font-medium text-destructive">{message}</CardContent>
    </Card>
  );
}

interface VideoTileProps {
  title: string;
  description?: string;
  thumbnail?: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function VideoTile({ title, description, thumbnail, meta, action, onClick, className }: VideoTileProps) {
  return (
    <Card
      className={cn('group gap-0 overflow-hidden pt-0 transition hover:border-primary/35', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden bg-secondary">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur">
            <Play className="h-5 w-5 fill-current" />
          </div>
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold tracking-[-0.02em] text-foreground group-hover:text-primary">{title}</h3>
        {description ? <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{description}</p> : null}
        {meta ? <div className="mt-4 text-xs text-muted-foreground">{meta}</div> : null}
        {action ? (
          <div className="mt-4" onClick={(event) => event.stopPropagation()}>
            {action}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function LoadingPanel({ label = 'Loading' }: { label?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_var(--primary)]" />
        {label}
      </CardContent>
    </Card>
  );
}

export function EmptyActionButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <Button onClick={onClick} className="gap-2">
      {children}
    </Button>
  );
}
