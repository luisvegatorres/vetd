"use client"

import { Mail } from "lucide-react"
import type { ComponentProps } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

type Props = Omit<ComponentProps<typeof InputGroupInput>, "type"> & {
  groupClassName?: string
  withIcon?: boolean
}

export function EmailInput({
  groupClassName,
  withIcon = true,
  ...props
}: Props) {
  return (
    <InputGroup className={groupClassName}>
      {withIcon ? (
        <InputGroupAddon>
          <Mail aria-hidden />
        </InputGroupAddon>
      ) : null}
      <InputGroupInput
        type="email"
        inputMode="email"
        autoComplete="email"
        spellCheck={false}
        {...props}
      />
    </InputGroup>
  )
}
