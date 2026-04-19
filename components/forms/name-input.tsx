"use client"

import { User } from "lucide-react"
import type { ComponentProps } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

type Props = Omit<
  ComponentProps<typeof InputGroupInput>,
  "autoCapitalize" | "autoComplete"
> & {
  groupClassName?: string
  withIcon?: boolean
}

export function NameInput({
  className,
  groupClassName,
  withIcon = true,
  ...props
}: Props) {
  return (
    <InputGroup className={groupClassName}>
      {withIcon ? (
        <InputGroupAddon>
          <User aria-hidden />
        </InputGroupAddon>
      ) : null}
      <InputGroupInput
        autoCapitalize="words"
        autoComplete="name"
        className={cn("capitalize", className)}
        {...props}
      />
    </InputGroup>
  )
}
