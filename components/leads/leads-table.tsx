import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/dashboard/data-table"
import { Dot } from "@/components/ui/dot"
import { cn } from "@/lib/utils"
import { LeadStatusBadge } from "./lead-status-badge"
import {
  SOURCE_LABEL,
  deriveStatus,
  formatAge,
  scoreBarColorClass,
  type LeadRow,
} from "./lead-types"

const COLS =
  "64px minmax(0,2.2fr) minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)"

function ScoreBar({ score }: { score: number | null }) {
  const pct = Math.max(0, Math.min(100, score ?? 0))
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-0.5 w-8 bg-border/60"
        aria-hidden
        role="presentation"
      >
        <div
          className={cn("h-full", scoreBarColorClass(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums">{score ?? 0}</span>
    </div>
  )
}

function OwnerChip({ owner }: { owner: LeadRow["owner"] }) {
  if (!owner)
    return (
      <span className="text-sm text-muted-foreground" aria-label="Unassigned">
        —
      </span>
    )
  return (
    <span className="truncate text-sm">
      {owner.full_name ?? "Unassigned"}
    </span>
  )
}

export function LeadsTable({
  rows,
  selectedId,
  buildRowHref,
}: {
  rows: LeadRow[]
  selectedId: string | null
  buildRowHref: (id: string) => string
}) {
  return (
    <DataTable cols={COLS} className="flex min-h-0 flex-1 flex-col">
      <DataTableHeader>
        <DataTableHead>Score</DataTableHead>
        <DataTableHead className="gap-2">
          Name <Dot /> Company
        </DataTableHead>
        <DataTableHead>Intent</DataTableHead>
        <DataTableHead className="gap-2">
          Source <Dot /> Age
        </DataTableHead>
        <DataTableHead>Rep</DataTableHead>
        <DataTableHead>Status</DataTableHead>
      </DataTableHeader>

      {rows.length === 0 ? (
        <DataTableEmpty>No leads match this view.</DataTableEmpty>
      ) : (
        <DataTableBody>
          {rows.map((row) => {
            const derived = deriveStatus(row)
            const isSelected = row.id === selectedId
            return (
              <DataTableRow
                key={row.id}
                href={buildRowHref(row.id)}
                selected={isSelected}
              >
                <DataTableCell>
                  <ScoreBar score={row.score} />
                </DataTableCell>

                <DataTableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.name}</p>
                    <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {row.company ?? "—"}
                    </p>
                  </div>
                </DataTableCell>

                <DataTableCell>
                  <p className="truncate text-sm">{row.intent ?? "—"}</p>
                </DataTableCell>

                <DataTableCell className="gap-2">
                  <span className="truncate text-sm text-muted-foreground">
                    {SOURCE_LABEL[row.source]}
                  </span>
                  <Dot />
                  <span className="truncate text-sm text-foreground">
                    {formatAge(row.created_at)}
                  </span>
                </DataTableCell>

                <DataTableCell>
                  <OwnerChip owner={row.owner} />
                </DataTableCell>

                <DataTableCell>
                  <LeadStatusBadge status={derived} />
                </DataTableCell>
              </DataTableRow>
            )
          })}
        </DataTableBody>
      )}
    </DataTable>
  )
}
