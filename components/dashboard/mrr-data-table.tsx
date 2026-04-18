"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type MrrStatus = "active" | "at_risk" | "canceled"

export type MrrRow = {
  client: string
  soldBy: string
  product: string
  plan: string
  since: string
  status: MrrStatus
  mrr: number
}

const STATUS_LABEL: Record<MrrStatus, string> = {
  active: "Active",
  at_risk: "At-risk",
  canceled: "Canceled",
}

const STATUS_CLASS: Record<MrrStatus, string> = {
  active: "bg-primary/10 text-primary",
  at_risk: "bg-orange-500/10 text-orange-500",
  canceled: "bg-destructive/10 text-destructive",
}

const STATUS_FILTER_LABEL: Record<string, string> = {
  all: "All statuses",
  active: "Active",
  at_risk: "At-risk",
  canceled: "Canceled",
}

const AVATAR_PALETTE = [
  "bg-orange-500/80",
  "bg-purple-500/80",
  "bg-[var(--chart-1)]/80",
  "bg-emerald-500/80",
  "bg-rose-500/80",
] as const

function avatarColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const fmtMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const columns: ColumnDef<MrrRow>[] = [
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => {
      const client = row.original.client
      return (
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-7 items-center justify-center text-[10px] font-medium uppercase tracking-ui text-white",
              avatarColor(client),
            )}
          >
            {initials(client)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{client}</p>
            <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Sold by · {row.original.soldBy}
            </p>
          </div>
        </div>
      )
    },
    filterFn: (row, _id, value) => {
      const v = String(value).toLowerCase()
      return (
        row.original.client.toLowerCase().includes(v) ||
        row.original.product.toLowerCase().includes(v)
      )
    },
  },
  {
    id: "product_plan",
    header: "Product · Plan",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.product}</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {row.original.plan} · Since {row.original.since}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          "border-transparent uppercase tracking-ui",
          STATUS_CLASS[row.original.status],
        )}
      >
        {STATUS_LABEL[row.original.status]}
      </Badge>
    ),
    filterFn: (row, _id, value) => {
      if (!value || value === "all") return true
      return row.original.status === value
    },
  },
  {
    accessorKey: "mrr",
    header: "MRR",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1 font-medium tabular-nums">
        {fmtMoney.format(row.original.mrr)}
        <span className="text-[10px] tracking-[0.12em] text-muted-foreground">
          /mo
        </span>
      </span>
    ),
  },
]

export function MrrDataTable({ rows }: { rows: MrrRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  })

  const search =
    (table.getColumn("client")?.getFilterValue() as string | undefined) ?? ""
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all"

  const pageSize = table.getState().pagination.pageSize
  const visibleRows = table.getRowModel().rows
  const fillerCount = Math.max(0, pageSize - visibleRows.length)
  const headerGroup = table.getHeaderGroups()[0]
  const gridCols =
    "grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]"

  return (
    <div className="flex h-full min-h-120 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
        <div className="relative flex-1 min-w-50">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients or products"
            value={search}
            onChange={(e) =>
              table.getColumn("client")?.setFilterValue(e.target.value)
            }
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            table
              .getColumn("status")
              ?.setFilterValue(v === "all" ? undefined : v)
          }
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Status">
              {(value: string) => STATUS_FILTER_LABEL[value] ?? "Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{STATUS_FILTER_LABEL.all}</SelectItem>
            <SelectItem value="active">
              {STATUS_FILTER_LABEL.active}
            </SelectItem>
            <SelectItem value="at_risk">
              {STATUS_FILTER_LABEL.at_risk}
            </SelectItem>
            <SelectItem value="canceled">
              {STATUS_FILTER_LABEL.canceled}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 [&>[data-slot=table-container]]:h-full">
        <Table
          className={cn(
            "grid h-full grid-rows-[auto_repeat(var(--rows),minmax(0,1fr))]",
            gridCols,
            "[&>tbody]:contents [&>thead]:contents",
          )}
          style={{ ["--rows" as string]: pageSize }}
        >
          <TableHeader>
            <TableRow className="col-span-full grid grid-cols-subgrid border-b border-border/60 hover:bg-transparent">
              {headerGroup?.headers.map((h) => (
                <TableHead
                  key={h.id}
                  className={cn(
                    "flex h-auto items-center px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
                    h.column.id === "mrr" && "justify-end",
                  )}
                >
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow
                className="col-span-full grid hover:bg-transparent"
                style={{ gridRow: "2 / -1" }}
              >
                <TableCell className="flex items-center justify-center text-sm text-muted-foreground">
                  No matching products.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {visibleRows.map((row, idx) => {
                  const isLastRendered =
                    idx === visibleRows.length - 1 && fillerCount === 0
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => console.log("row clicked", row.original)}
                      className={cn(
                        "col-span-full grid cursor-pointer grid-cols-subgrid transition-colors hover:bg-foreground/5",
                        isLastRendered
                          ? "border-b-0"
                          : "border-b border-border/60",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "flex items-center px-4 py-3",
                            cell.column.id === "mrr" && "justify-end",
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
                {Array.from({ length: fillerCount }).map((_, i) => {
                  const isLastRendered = i === fillerCount - 1
                  return (
                    <TableRow
                      key={`filler-${i}`}
                      aria-hidden
                      className={cn(
                        "col-span-full grid grid-cols-subgrid hover:bg-transparent",
                        isLastRendered
                          ? "border-b-0"
                          : "border-b border-border/60",
                      )}
                    >
                      {headerGroup?.headers.map((h) => (
                        <TableCell key={h.id} className="p-0" />
                      ))}
                    </TableRow>
                  )
                })}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1} · {table.getFilteredRowModel().rows.length}{" "}
          results
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
