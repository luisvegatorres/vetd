import Link from "next/link"
import {
  CreditCard,
  MessageSquarePlus,
  Plus,
  Presentation,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type QuickAction = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  primary?: boolean
}

const actions: QuickAction[] = [
  { href: "/leads?new=1", label: "New Lead", icon: UserPlus, primary: true },
  { href: "/projects?new=1", label: "New Project", icon: Plus },
  { href: "/payments?new=1", label: "Record Payment", icon: CreditCard },
  {
    href: "/clients?log=1",
    label: "Log Interaction",
    icon: MessageSquarePlus,
  },
  { href: "/pitch-mode", label: "Open Pitch Mode", icon: Presentation },
]

export function QuickActions() {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-overline font-medium uppercase tracking-ui text-muted-foreground">
          Quick actions
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.href}
            variant={action.primary ? "default" : "outline"}
            size="sm"
            nativeButton={false}
            className="gap-2"
            render={<Link href={action.href} />}
          >
            <action.icon />
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  )
}
