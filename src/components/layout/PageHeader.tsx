'use client';
import React from 'react';
export const PageHeader: React.FC<{
  kicker: string; title: string; description?: string;
  actions?: React.ReactNode;
}> = ({ kicker, title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 anim-fade-up">
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{kicker}</p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-1">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
