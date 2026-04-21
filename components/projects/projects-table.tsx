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
import { ProjectStageBadge } from "./project-stage-badge"
import {
  formatDate,
  formatUsdMonthlyShort,
  formatUsdShortWithZero,
  isDepositPending,
  PRODUCT_TYPE_LABEL,
  projectDisplayClient,
  type ProjectRow,
} from "./project-types"

const COLS =
  "minmax(0,1fr) minmax(0,1.8fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr) minmax(0,0.8fr)"

export function ProjectsTable({
  rows,
  selectedId,
  buildRowHref,
}: {
  rows: ProjectRow[]
  selectedId: string | null
  buildRowHref: (id: string) => string
}) {
  return (
    <DataTable cols={COLS} className="flex min-h-0 flex-1 flex-col">
      <DataTableHeader>
        <DataTableHead>Project</DataTableHead>
        <DataTableHead>Client</DataTableHead>
        <DataTableHead>Revenue</DataTableHead>
        <DataTableHead>One-time payment</DataTableHead>
        <DataTableHead>Rep</DataTableHead>
        <DataTableHead>Deadline</DataTableHead>
        <DataTableHead align="end">Stage</DataTableHead>
      </DataTableHeader>

      {rows.length === 0 ? (
        <DataTableEmpty>No projects match this view.</DataTableEmpty>
      ) : (
        <DataTableBody>
          {rows.map((row) => {
            const isSelected = row.id === selectedId
            const depositPending = isDepositPending(row)
            const oneTimeValue = row.value ?? 0
            const hasOneTimeAmount =
              row.value != null || Boolean(row.subscription)
            return (
              <DataTableRow
                key={row.id}
                href={buildRowHref(row.id)}
                selected={isSelected}
              >
                <DataTableCell>
                  <p className="flex items-center gap-2 truncate font-medium">
                    {depositPending ? (
                      <span
                        aria-label="Deposit pending"
                        className="size-2 shrink-0 rounded-full bg-orange-500"
                      />
                    ) : null}
                    <span className="truncate">
                      {row.product_type
                        ? PRODUCT_TYPE_LABEL[row.product_type]
                        : "—"}
                    </span>
                  </p>
                </DataTableCell>

                <DataTableCell>
                  <p className="truncate text-sm text-muted-foreground">
                    {projectDisplayClient(row)}
                  </p>
                </DataTableCell>

                <DataTableCell>
                  <div className="min-w-0">
                    <p className="truncate text-sm tabular-nums">
                      {hasOneTimeAmount
                        ? formatUsdShortWithZero(oneTimeValue)
                        : "—"}
                    </p>
                    {row.subscription ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground uppercase tabular-nums">
                        {formatUsdMonthlyShort(row.subscription.monthly_rate)}{" "}
                        MRR
                      </p>
                    ) : null}
                  </div>
                </DataTableCell>

                <DataTableCell>
                  {oneTimeValue > 0 ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-transparent uppercase",
                        paymentStatusBadgeClass(row.payment_status)
                      )}
                    >
                      {paymentStatusLabel(row.payment_status)}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      $0 one-time
                    </span>
                  )}
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

                <DataTableCell>
                  <span className="truncate text-sm text-muted-foreground tabular-nums">
                    {formatDate(row.deadline)}
                  </span>
                </DataTableCell>

                <DataTableCell align="end">
                  <ProjectStageBadge stage={row.stage} />
                </DataTableCell>
              </DataTableRow>
            )
          })}
        </DataTableBody>
      )}
    </DataTable>
  )
}
