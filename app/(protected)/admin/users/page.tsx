import { redirect } from "next/navigation"

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/dashboard/data-table"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { CreateUserForm } from "./create-user-form"
import { EmploymentToggle } from "./employment-toggle"

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user!.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, employment_status, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Admin"
        title="Users"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:items-start">
        <section className="border border-border/60">
          <header className="border-b border-border/60 p-6">
            <h2 className="font-heading text-lg font-medium">Team</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Toggle employment status to start or stop a rep&apos;s residual
              commissions.
            </p>
          </header>

          <DataTable cols="minmax(0,1fr) auto auto">
            <DataTableHeader>
              <DataTableHead>Name</DataTableHead>
              <DataTableHead>Role</DataTableHead>
              <DataTableHead align="end">Employment</DataTableHead>
            </DataTableHeader>
            {!profiles || profiles.length === 0 ? (
              <DataTableEmpty>No users yet.</DataTableEmpty>
            ) : (
              <DataTableBody>
                {profiles.map((p) => (
                  <DataTableRow key={p.id}>
                    <DataTableCell>
                      <p className="text-sm font-medium">
                        {p.full_name ?? "Unnamed"}
                      </p>
                    </DataTableCell>
                    <DataTableCell>
                      <Badge variant="outline" className="uppercase">
                        {p.role}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell align="end">
                      <EmploymentToggle
                        profileId={p.id}
                        status={p.employment_status}
                        isSelf={p.id === auth.user!.id}
                      />
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            )}
          </DataTable>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Invite user</CardTitle>
            <CardDescription>
              Creates an account so they can sign in via one-time code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUserForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
