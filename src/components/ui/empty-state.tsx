import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-[13px] text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
