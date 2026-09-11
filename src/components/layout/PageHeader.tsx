'use client';
import React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { Crumb } from '@/components/layout/Navbar';
import { cn } from '@/lib/utils';

export const PageHeader: React.FC<{
  icon?: LucideIcon | string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  crumbs?: Crumb[];
}> = ({ icon: Icon, title, description, actions, crumbs }) => (
  <div className="space-y-2">
    {crumbs && crumbs.length > 0 && (
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={crumb.label} className="flex min-w-0 items-center gap-1">
              {i > 0 && <span className="text-muted-foreground">/</span>}
              {crumb.href && !last ? (
                <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors duration-150 truncate">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn('truncate', last ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    )}
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent text-lg font-semibold">
            {typeof Icon === 'string' ? <span aria-hidden>{Icon}</span> : <Icon className="w-[18px] h-[18px]" />}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-[28px] leading-[1.2] font-bold tracking-[-0.02em] text-foreground text-balance">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  </div>
);
