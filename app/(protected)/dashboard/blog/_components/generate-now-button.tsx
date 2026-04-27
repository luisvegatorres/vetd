"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import { generateDraftNow } from "@/app/(protected)/dashboard/blog/actions"
import { TECH_FOCUS, VERTICALS } from "@/lib/blog/topic-pillars"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Triggers the same Gemini generation pipeline used by the daily cron, on
 * demand. Default item ("Today's angle") leaves both ids undefined so the
 * runner falls back to the day-of-year rotation through (vertical × tech);
 * the rest of the menu lets the user lock either dimension when they want
 * to focus the next post on a specific industry or technology.
 */
export function GenerateNowButton() {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  async function run(args?: { verticalId?: string; techId?: string }) {
    setPending(true)
    try {
      const res = await generateDraftNow(args)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`Draft created: ${res.title}`)
      router.push(`/dashboard/blog/${res.postId}`)
    } finally {
      setPending(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="gap-2"
          >
            <Sparkles className="size-4" />
            {pending ? "Generating…" : "Generate with AI"}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onClick={() => run()}>
          Today&apos;s angle (rotation)
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Force vertical</DropdownMenuLabel>
          {VERTICALS.map((vertical) => (
            <DropdownMenuSub key={vertical.id}>
              <DropdownMenuSubTrigger>
                {vertical.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                <DropdownMenuItem
                  onClick={() => run({ verticalId: vertical.id })}
                >
                  Any tech (today&apos;s rotation)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {TECH_FOCUS.map((tech) => (
                  <DropdownMenuItem
                    key={tech.id}
                    onClick={() =>
                      run({ verticalId: vertical.id, techId: tech.id })
                    }
                  >
                    {tech.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Force tech focus</DropdownMenuLabel>
          {TECH_FOCUS.map((tech) => (
            <DropdownMenuItem
              key={tech.id}
              onClick={() => run({ techId: tech.id })}
            >
              {tech.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
