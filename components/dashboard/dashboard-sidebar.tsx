"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Briefcase,
  DollarSign,
  Inbox,
  Layers,
  LayoutGrid,
  Presentation,
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
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const workspaceNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/pipeline", label: "Pipeline", icon: Layers },
  { href: "/leads", label: "Leads", icon: Inbox, badge: 5 },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/payments", label: "Payments", icon: DollarSign },
  { href: "/commissions", label: "Commissions", icon: TrendingUp },
  { href: "/pitch-mode", label: "Pitch Mode", icon: Presentation },
]

const accountNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
]

const adminNav: NavItem[] = [
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: UserCog },
]

const itemClasses = "font-medium tracking-ui text-xs"
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

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="font-heading text-sm font-medium tracking-ui text-foreground uppercase"
        >
          <span className="group-data-[collapsible=icon]:hidden">
            {site.name}
          </span>
          <span className="hidden group-data-[collapsible=icon]:inline">
            IA
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-ui">
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
            <SidebarGroupLabel className="uppercase tracking-ui">
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
