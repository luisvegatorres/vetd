import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single()

  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarCookie ? sidebarCookie === "true" : true

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardSidebar isAdmin={profile?.role === "admin"} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md">
          <SidebarTrigger />
        </header>
        <div className="w-full flex-1 p-6 md:p-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
