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
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims

  if (!claims?.sub) {
    redirect("/auth/login")
  }

  const userId = claims.sub
  const userEmail = typeof claims.email === "string" ? claims.email : undefined

  const [{ data: profile }, newLeadsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", userId)
      .single(),
    supabase.rpc("new_leads_count"),
  ])

  const newLeadsCount = newLeadsRes.data ?? 0

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ??
    userEmail?.split("@")[0] ??
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
        fullName={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
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
