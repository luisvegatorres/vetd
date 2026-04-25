"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { OUTREACH_TOKEN_GROUPS } from "@/lib/outreach/tokens"

type Props = {
  onInsert: (snippet: string) => void
}

export function OutreachInsertMenu({ onInsert }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" type="button">
            <PlusIcon />
            Insert token
          </Button>
        }
      />
      <PopoverContent align="end" className="w-72 p-3">
        <div className="flex max-h-80 flex-col gap-4 overflow-y-auto">
          {OUTREACH_TOKEN_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="text-overline font-medium text-muted-foreground uppercase">
                {group.label}
              </p>
              <ul className="flex flex-col">
                {group.tokens.map((t) => (
                  <li key={t.name}>
                    <button
                      type="button"
                      onClick={() => onInsert(`{{${t.name}}}`)}
                      className="block w-full px-2 py-1 text-left text-sm hover:bg-accent"
                      title={`{{${t.name}}}`}
                    >
                      {t.description}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
