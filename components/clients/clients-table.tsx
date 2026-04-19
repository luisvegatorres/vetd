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
import { OwnerChip } from "./client-chips"
import { ClientStatusBadge } from "./client-status-badge"
import {
  clientDisplayName,
  deriveClientStatus,
  formatUsdShort,
  type ClientRow,
} from "./client-types"

const COLS =
  "minmax(0,2.2fr) minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,0.6fr) minmax(0,1fr)"

export function ClientsTable({
  rows,
  selectedId,
  buildRowHref,
}: {
  rows: ClientRow[]
  selectedId: string | null
  buildRowHref: (id: string) => string
}) {
  return (
    <DataTable cols={COLS} className="flex min-h-0 flex-1 flex-col">
      <DataTableHeader>
        <DataTableHead className="gap-2">
          Business <Dot /> Contact
        </DataTableHead>
        <DataTableHead>Industry</DataTableHead>
        <DataTableHead>Lifetime</DataTableHead>
        <DataTableHead>MRR</DataTableHead>
        <DataTableHead>Rep</DataTableHead>
        <DataTableHead align="end">Status</DataTableHead>
      </DataTableHeader>

      {rows.length === 0 ? (
        <DataTableEmpty>No clients match this view.</DataTableEmpty>
      ) : (
        <DataTableBody>
          {rows.map((row) => {
            const derived = deriveClientStatus(row)
            const isSelected = row.id === selectedId
            const display = clientDisplayName(row)
            return (
              <DataTableRow
                key={row.id}
                href={buildRowHref(row.id)}
                selected={isSelected}
              >
                <DataTableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{display}</p>
                    <p className="mt-1 truncate text-xs font-medium uppercase text-muted-foreground">
                      {row.company ? row.name : (row.email ?? "—")}
                    </p>
                  </div>
                </DataTableCell>

                <DataTableCell>
                  <p className="truncate text-sm text-muted-foreground">
                    {row.industry ?? "—"}
                  </p>
                </DataTableCell>

                <DataTableCell>
                  <p className="truncate text-sm tabular-nums">
                    {formatUsdShort(row.lifetime)}
                  </p>
                </DataTableCell>

                <DataTableCell>
                  {row.mrr > 0 ? (
                    <span className="truncate text-sm tabular-nums">
                      {formatUsdShort(row.mrr)}
                      <span className="text-xs text-muted-foreground">
                        /mo
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </DataTableCell>

                <DataTableCell>
                  <OwnerChip owner={row.owner} />
                </DataTableCell>

                <DataTableCell align="end">
                  <ClientStatusBadge status={derived} />
                </DataTableCell>
              </DataTableRow>
            )
          })}
        </DataTableBody>
      )}
    </DataTable>
  )
}
