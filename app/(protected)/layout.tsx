import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { UserIcon } from "lucide-react"
import { ThemeToggle } from "@/components/dashboard/theme-toggle"
import { HeaderBreadcrumb } from "@/components/layout/header-breadcrumb"

function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  if (!auth?.user) {
    redirect("/auth/login")
  }

  const [{ data: profile }, leadsRes, interactionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", auth.user.id)
      .single(),
    supabase.from("clients").select("id").eq("status", "lead"),
    supabase.from("interactions").select("client_id"),
  ])

  const contactedIds = new Set(
    (interactionsRes.data ?? []).map((r) => r.client_id),
  )
  const newLeadsCount = (leadsRes.data ?? []).filter(
    (r) => !contactedIds.has(r.id),
  ).length

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ??
    auth.user.email?.split("@")[0] ??
    "there"

  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarCookie ? sidebarCookie === "true" : true

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardSidebar
        isAdmin={profile?.role === "admin"}
        newLeadsCount={newLeadsCount}
        greeting={getGreeting()}
        firstName={firstName}
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <HeaderBreadcrumb />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <UserIcon className="size-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <div className="w-full flex-1 p-6 md:p-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
