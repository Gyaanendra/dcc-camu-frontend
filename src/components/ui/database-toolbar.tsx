import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "./input"

interface DatabaseToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
  count?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

function DatabaseToolbar({
  search,
  onSearchChange,
  placeholder = "Search",
  count,
  children,
  className,
}: DatabaseToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="h-8 pl-8 text-[13px]"
        />
      </div>
      {children}
      {count !== undefined && (
        <div className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
          {count}
        </div>
      )}
    </div>
  )
}

export { DatabaseToolbar }
