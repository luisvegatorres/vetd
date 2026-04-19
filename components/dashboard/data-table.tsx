"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Dot } from "@/components/ui/dot"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * Grid-based data table built on the shadcn Table primitive.
 *
 * Pass a CSS `grid-template-columns` value (e.g. `"64px minmax(0,2fr) 1fr"`)
 * as `cols`; rows inherit it via a CSS variable so every row shares the same
 * column widths.
 */
export function DataTable({
  cols,
  className,
  children,
}: {
  cols: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Table
      data-slot="data-table"
      className={cn(
        "grid [&>tbody]:contents [&>thead]:contents",
        className,
      )}
      style={{ ["--dt-cols" as string]: cols }}
    >
      {children}
    </Table>
  )
}

const ROW_GRID =
  "col-span-full grid grid-cols-[var(--dt-cols)] items-center gap-4 px-4"

export function DataTableHeader({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <TableHeader>
      <TableRow
        className={cn(
          ROW_GRID,
          "border-b border-border/60 py-2 hover:bg-transparent",
          className,
        )}
      >
        {children}
      </TableRow>
    </TableHeader>
  )
}

export function DataTableHead({
  align = "start",
  className,
  children,
}: {
  align?: "start" | "end"
  className?: string
  children?: React.ReactNode
}) {
  return (
    <TableHead
      className={cn(
        "flex h-auto min-w-0 items-center p-0",
        "text-xs font-medium uppercase text-muted-foreground",
        align === "end" && "justify-end",
        className,
      )}
    >
      {children}
    </TableHead>
  )
}

export function DataTableBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <TableBody className={className}>{children}</TableBody>
}

export function DataTableRow({
  className,
  selected,
  href,
  children,
}: {
  className?: string
  selected?: boolean
  href?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const interactive = Boolean(href)

  return (
    <TableRow
      onClick={href ? () => router.push(href) : undefined}
      aria-current={selected ? "true" : undefined}
      data-state={selected ? "selected" : undefined}
      className={cn(
        ROW_GRID,
        "border-b border-border/60 py-3 last:border-b-0",
        "transition-colors",
        interactive && "cursor-pointer hover:bg-foreground/5",
        selected && "bg-foreground/5",
        className,
      )}
    >
      {children}
    </TableRow>
  )
}

export function DataTableCell({
  align = "start",
  className,
  children,
}: {
  align?: "start" | "end"
  className?: string
  children?: React.ReactNode
}) {
  return (
    <TableCell
      className={cn(
        "flex min-w-0 items-center p-0",
        align === "end" && "justify-end",
        className,
      )}
    >
      {children}
    </TableCell>
  )
}

export function DataTablePagination({
  page,
  pageCount,
  total,
  onPageChange,
  className,
}: {
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}) {
  const canPrev = page > 1
  const canNext = page < pageCount
  const safeCount = Math.max(pageCount, 1)
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3",
        className,
      )}
    >
      <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        <span>Page {page} of {safeCount}</span>
        <Dot />
        <span>{total} {total === 1 ? "result" : "results"}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

export function DataTableEmpty({
  className,
  children = "No results.",
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <TableBody>
      <TableRow className="col-span-full hover:bg-transparent">
        <TableCell
          className={cn(
            "flex items-center justify-center px-4 py-16 text-sm text-muted-foreground",
            className,
          )}
        >
          {children}
        </TableCell>
      </TableRow>
    </TableBody>
  )
}
