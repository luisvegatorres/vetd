"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { DataTablePagination } from "@/components/dashboard/data-table"

export function ClientsPagination({
  page,
  pageCount,
  total,
  className,
}: {
  page: number
  pageCount: number
  total: number
  className?: string
}) {
  const router = useRouter()
  const params = useSearchParams()

  return (
    <DataTablePagination
      page={page}
      pageCount={pageCount}
      total={total}
      className={className}
      onPageChange={(next) => {
        const qs = new URLSearchParams(params.toString())
        if (next <= 1) qs.delete("page")
        else qs.set("page", String(next))
        qs.delete("client")
        const s = qs.toString()
        router.push(s ? `/clients?${s}` : "/clients", { scroll: false })
      }}
    />
  )
}
