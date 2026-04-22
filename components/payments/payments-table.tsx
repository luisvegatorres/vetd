import { Repeat, CircleDollarSign } from "lucide-react"

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/status-colors"
import { formatDate, formatUsdFull } from "@/components/projects/project-types"
import {
  isPaymentFailed,
  paymentDisplayClient,
  paymentSourceLabel,
  type PaymentRow,
} from "./payment-types"

const COLS =
  "minmax(0,0.9fr) minmax(0,1.4fr) minmax(0,1.6fr) minmax(0,0.9fr) minmax(0,1fr) minmax(0,0.9fr)"

export function PaymentsTable({
  rows,
  selectedId,
  buildRowHref,
}: {
  rows: PaymentRow[]
  selectedId: string | null
  buildRowHref: (id: string) => string
}) {
  return (
    <DataTable cols={COLS} className="flex min-h-0 flex-1 flex-col">
      <DataTableHeader>
        <DataTableHead>Date</DataTableHead>
        <DataTableHead>Client</DataTableHead>
        <DataTableHead>Source</DataTableHead>
        <DataTableHead align="end">Amount</DataTableHead>
        <DataTableHead>Rep</DataTableHead>
        <DataTableHead align="end">Status</DataTableHead>
      </DataTableHeader>

      {rows.length === 0 ? (
        <DataTableEmpty>No payments match this view.</DataTableEmpty>
      ) : (
        <DataTableBody>
          {rows.map((row) => {
            const isSelected = row.id === selectedId
            const KindIcon =
              row.kind === "subscription" ? Repeat : CircleDollarSign
            const failed = isPaymentFailed(row)
            return (
              <DataTableRow
                key={row.id}
                href={buildRowHref(row.id)}
                selected={isSelected}
              >
                <DataTableCell>
                  <span className="flex items-center gap-2">
                    {failed ? (
                      <span
                        aria-label="Needs attention"
                        className="size-2 shrink-0 rounded-full bg-orange-500"
                      />
                    ) : null}
                    <span className="truncate text-sm text-muted-foreground tabular-nums">
                      {formatDate(row.paid_at ?? row.created_at)}
                    </span>
                  </span>
                </DataTableCell>

                <DataTableCell>
                  <p className="truncate text-sm font-medium">
                    {paymentDisplayClient(row)}
                  </p>
                </DataTableCell>

                <DataTableCell>
                  <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
                    <KindIcon
                      aria-hidden
                      className="size-3.5 shrink-0"
                    />
                    <span className="truncate">{paymentSourceLabel(row)}</span>
                  </p>
                </DataTableCell>

                <DataTableCell align="end">
                  <span className="text-sm tabular-nums">
                    {formatUsdFull(row.amount)}
                  </span>
                </DataTableCell>

                <DataTableCell>
                  {row.rep?.full_name ? (
                    <span className="truncate text-sm">
                      {row.rep.full_name}
                    </span>
                  ) : (
                    <span
                      aria-label="Unassigned"
                      className="text-sm text-muted-foreground"
                    >
                      —
                    </span>
                  )}
                </DataTableCell>

                <DataTableCell align="end">
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-transparent uppercase",
                      paymentStatusBadgeClass(row.status)
                    )}
                  >
                    {paymentStatusLabel(row.status)}
                  </Badge>
                </DataTableCell>
              </DataTableRow>
            )
          })}
        </DataTableBody>
      )}
    </DataTable>
  )
}
