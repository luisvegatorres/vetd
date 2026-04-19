"use client"

import { Building2 } from "lucide-react"
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

export function BusinessInput({
  className,
  groupClassName,
  withIcon = true,
  ...props
}: Props) {
  return (
    <InputGroup className={groupClassName}>
      {withIcon ? (
        <InputGroupAddon>
          <Building2 aria-hidden />
        </InputGroupAddon>
      ) : null}
      <InputGroupInput
        autoCapitalize="words"
        autoComplete="organization"
        className={cn("capitalize", className)}
        {...props}
      />
    </InputGroup>
  )
}
