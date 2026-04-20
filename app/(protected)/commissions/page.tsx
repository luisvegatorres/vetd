import { redirect } from "next/navigation"

import { CommissionsView } from "@/components/commissions/commissions-view"
import { PageHeader } from "@/components/dashboard/page-header"
import { createClient } from "@/lib/supabase/server"

export default async function CommissionsPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", auth.user.id)
    .single()

  const role = profile?.role ?? "viewer"
  const isAdmin = role === "admin"
  const isRep = role === "sales_rep"

  if (!isAdmin && !isRep) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Commissions"
          title="Commissions"
          description="Sales rep payouts — signing bonuses and monthly residuals from active subscriptions."
        />
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to this page.
        </p>
      </div>
    )
  }

  // Reps see only their own ledger; admins see everyone's.
  const ledgerQuery = supabase
    .from("subscription_commission_ledger")
    .select(
      "id, kind, period_month, amount, status, paid_at, created_at, notes, rep_id, subscription_id",
    )
    .order("created_at", { ascending: false })

  if (isRep) ledgerQuery.eq("rep_id", auth.user.id)

  const [{ data: ledger }, { data: profiles }, { data: subscriptions }] =
    await Promise.all([
      ledgerQuery,
      supabase.from("profiles").select("id, full_name"),
      supabase
        .from("subscriptions")
        .select(
          "id, plan, monthly_rate, monthly_residual_amount, signing_bonus_amount, status, started_at, sold_by, client_id, first_payment_at",
        ),
    ])

  const clientIds = Array.from(
    new Set((subscriptions ?? []).map((s) => s.client_id)),
  )
  const { data: clients } = clientIds.length
    ? await supabase
        .from("clients")
        .select("id, name, company")
        .in("id", clientIds)
    : { data: [] }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commissions"
        title={isAdmin ? "Commissions" : "My book of business"}
        description={
          isAdmin
            ? "Signing bonuses and monthly residuals owed to sales reps. Mark rows as paid once the rep has been paid out."
            : "Active subscriptions you closed and the residuals they generate while you're with the company."
        }
      />

      <CommissionsView
        ledger={ledger ?? []}
        profiles={profiles ?? []}
        subscriptions={subscriptions ?? []}
        clients={clients ?? []}
        currentUserId={auth.user.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
