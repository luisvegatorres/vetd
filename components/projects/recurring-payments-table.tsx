"use client"

import { useMemo, useState } from "react"

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTablePagination,
  DataTableRow,
} from "@/components/dashboard/data-table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatDate, formatUsdFull } from "./project-types"
import type { SubscriptionInvoiceRow } from "./project-detail-view"

const PAGE_SIZE = 5
const COLS =
  "minmax(0,1fr) minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)"

type StatusFilter = "all" | "paid" | "open" | "void" | "uncollectible"
type TypeFilter = "all" | "first" | "renewal" | "other"

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  all: "All statuses",
  paid: "Paid",
  open: "Open",
  void: "Void",
  uncollectible: "Uncollectible",
}

const TYPE_FILTER_LABEL: Record<TypeFilter, string> = {
  all: "All types",
  first: "First invoice",
  renewal: "Renewal",
  other: "Other",
}

function invoiceStatusTone(status: string): string {
  if (status === "paid") return "text-emerald-600 dark:text-emerald-400"
  if (status === "open" || status === "draft")
    return "text-orange-600 dark:text-orange-400"
  if (status === "uncollectible" || status === "void") return "text-destructive"
  return "text-muted-foreground"
}

function billingReasonLabel(reason: string | null): string {
  if (!reason) return "—"
  if (reason === "subscription_create") return "First invoice"
  if (reason === "subscription_cycle") return "Renewal"
  if (reason === "subscription_update") return "Plan change"
  if (reason === "manual") return "Manual"
  return reason.replace(/^subscription_/, "").replace(/_/g, " ")
}

function invoiceTypeKey(reason: string | null): TypeFilter {
  if (reason === "subscription_create") return "first"
  if (reason === "subscription_cycle") return "renewal"
  return "other"
}

function formatBillingPeriod(
  start: string | null,
  end: string | null
): string {
  if (!start && !end) return "—"
  const fmt = (iso: string | null) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }
  return `${fmt(start)} – ${fmt(end)}`
}

export function RecurringPaymentsTable({
  invoices,
}: {
  invoices: SubscriptionInvoiceRow[]
}) {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false
      if (
        typeFilter !== "all" &&
        invoiceTypeKey(inv.billing_reason) !== typeFilter
      ) {
        return false
      }
      return true
    })
  }, [invoices, statusFilter, typeFilter])

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)

  const handleStatusChange = (value: string | null) => {
    setStatusFilter((value ?? "all") as StatusFilter)
    setPage(1)
  }
  const handleTypeChange = (value: string | null) => {
    setTypeFilter((value ?? "all") as TypeFilter)
    setPage(1)
  }

  return (
    <div className="flex flex-col border border-border/60">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Type">
              {(value: string) =>
                TYPE_FILTER_LABEL[value as TypeFilter] ?? "Type"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Type</SelectLabel>
              <SelectItem value="all">{TYPE_FILTER_LABEL.all}</SelectItem>
              <SelectItem value="first">{TYPE_FILTER_LABEL.first}</SelectItem>
              <SelectItem value="renewal">
                {TYPE_FILTER_LABEL.renewal}
              </SelectItem>
              <SelectItem value="other">{TYPE_FILTER_LABEL.other}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Status">
              {(value: string) =>
                STATUS_FILTER_LABEL[value as StatusFilter] ?? "Status"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              <SelectItem value="all">{STATUS_FILTER_LABEL.all}</SelectItem>
              <SelectItem value="paid">{STATUS_FILTER_LABEL.paid}</SelectItem>
              <SelectItem value="open">{STATUS_FILTER_LABEL.open}</SelectItem>
              <SelectItem value="void">{STATUS_FILTER_LABEL.void}</SelectItem>
              <SelectItem value="uncollectible">
                {STATUS_FILTER_LABEL.uncollectible}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <DataTable cols={COLS}>
        <DataTableHeader>
          <DataTableHead>Date</DataTableHead>
          <DataTableHead>Type</DataTableHead>
          <DataTableHead>Period</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead align="end">Amount</DataTableHead>
        </DataTableHeader>

        {filtered.length === 0 ? (
          <DataTableEmpty>
            {invoices.length === 0
              ? "No recurring payments yet."
              : "No payments match these filters."}
          </DataTableEmpty>
        ) : (
          <DataTableBody>
            {pageRows.map((inv) => (
              <DataTableRow key={inv.id}>
                <DataTableCell className="text-sm text-muted-foreground tabular-nums">
                  {formatDate(inv.paid_at ?? inv.created_at)}
                </DataTableCell>
                <DataTableCell className="text-sm">
                  {billingReasonLabel(inv.billing_reason)}
                </DataTableCell>
                <DataTableCell className="text-sm text-muted-foreground tabular-nums">
                  {formatBillingPeriod(inv.period_start, inv.period_end)}
                </DataTableCell>
                <DataTableCell>
                  <span
                    className={cn(
                      "text-xs tracking-wide uppercase",
                      invoiceStatusTone(inv.status)
                    )}
                  >
                    {inv.status}
                  </span>
                </DataTableCell>
                <DataTableCell
                  align="end"
                  className="text-sm tabular-nums"
                >
                  {formatUsdFull(inv.amount_paid)}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        )}
      </DataTable>

      <DataTablePagination
        page={safePage}
        pageCount={pageCount}
        total={filtered.length}
        onPageChange={setPage}
      />
    </div>
  )
}
