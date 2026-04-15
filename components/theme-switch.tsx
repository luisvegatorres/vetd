"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { Switch } from "@/components/ui/switch"

export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <div className="flex items-center gap-2">
      <Sun className="size-3.5 text-muted-foreground" />
      <Switch
        size="sm"
        checked={mounted ? isDark : false}
        onCheckedChange={(checked: boolean) =>
          setTheme(checked ? "dark" : "light")
        }
        aria-label="Toggle dark mode"
      />
      <Moon className="size-3.5 text-muted-foreground" />
    </div>
  )
}
