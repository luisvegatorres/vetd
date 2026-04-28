"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  BarChart3,
  BookOpen,
  Briefcase,
  CreditCard,
  FileText,
  Inbox,
  Layers,
  LayoutGrid,
  Plug,
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
import { Logo, Logotype } from "@/components/brand/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
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
        render={<Link href={item.href} prefetch />}
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
  fullName,
  avatarUrl,
}: {
  isAdmin: boolean
  newLeadsCount: number
  greeting: string
  firstName: string
  fullName: string | null
  avatarUrl: string | null
}) {
  const pathname = usePathname()
  const workspaceNav = buildWorkspaceNav(newLeadsCount)

  // /dashboard is a leaf — without an exact match guard it would also light
  // up while we're on any future /dashboard/* route.
  const isActive = (href: string) => {
    if (pathname === href) return true
    if (href === "/dashboard") return false
    return pathname.startsWith(`${href}/`)
  }

  const initials = getInitials(fullName ?? firstName)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-4 group-data-[collapsible=icon]:p-2">
        <Link
          href="/dashboard"
          aria-label={site.name}
          className="inline-flex items-center text-foreground"
        >
          <Logotype
            height={18}
            className="group-data-[collapsible=icon]:hidden"
          />
          <Logo
            size={20}
            className="hidden group-data-[collapsible=icon]:inline-block"
          />
        </Link>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/settings" />}
          className="group-data-[collapsible=icon]:hidden justify-start gap-2"
        >
          <Avatar size="sm">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={fullName ?? firstName} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
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

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}
