"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  BarChart3,
  Briefcase,
  CreditCard,
  FileText,
  Inbox,
  Layers,
  LayoutGrid,
  Settings,
  TrendingUp,
  Users,
  UserCog,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LogoutButton } from "@/components/auth/logout-button"
import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

function buildWorkspaceNav(newLeadsCount: number): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    {
      href: "/leads",
      label: "Leads",
      icon: Inbox,
      badge: newLeadsCount > 0 ? newLeadsCount : undefined,
    },
    { href: "/pipeline", label: "Pipeline", icon: Layers },
    { href: "/projects", label: "Projects", icon: Briefcase },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/payments", label: "Payments", icon: CreditCard },
    { href: "/commissions", label: "Commissions", icon: TrendingUp },
    { href: "/documents", label: "Documents", icon: FileText },
  ]
}

const accountNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
]

const adminNav: NavItem[] = [
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/rep-activity", label: "Rep Activity", icon: Activity },
  { href: "/admin/users", label: "Users", icon: UserCog },
]

const itemClasses = "font-medium text-xs"
const inactiveClasses = "text-muted-foreground"

function NavItemLink({
  item,
  active,
}: {
  item: NavItem
  active: boolean
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.label}
        render={<Link href={item.href} />}
        className={cn(itemClasses, !active && inactiveClasses)}
      >
        <item.icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
      {item.badge != null ? (
        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  )
}

export function DashboardSidebar({
  isAdmin,
  newLeadsCount,
  greeting,
  firstName,
}: {
  isAdmin: boolean
  newLeadsCount: number
  greeting: string
  firstName: string
}) {
  const pathname = usePathname()
  const workspaceNav = buildWorkspaceNav(newLeadsCount)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <Link
          href="/dashboard"
          className="font-heading text-sm font-medium text-foreground uppercase"
        >
          <span className="group-data-[collapsible=icon]:hidden">
            {site.name}
          </span>
          <span className="hidden group-data-[collapsible=icon]:inline">
            IA
          </span>
        </Link>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/settings" />}
          className="group-data-[collapsible=icon]:hidden justify-start"
        >
          {greeting}, {firstName}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceNav.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel className="uppercase">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {accountNav.map((item) => (
            <NavItemLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
            />
          ))}
        </SidebarMenu>
        <div className="group-data-[collapsible=icon]:hidden">
          <LogoutButton />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
