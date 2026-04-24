"use client"

import * as React from "react"
import { Calculator } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { financing } from "@/lib/site"

type FinancingCalculatorDialogProps = React.ComponentProps<typeof Button>

const MIN_AMOUNT = financing.minAmount
const MONTHS = financing.months
const DEPOSIT_RATE = financing.depositRate / 100

export function FinancingCalculatorDialog({
  children,
  ...props
}: FinancingCalculatorDialogProps) {
  const t = useTranslations("financing.calculator")

  const numberFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )

  const numberFormatterWhole = React.useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }),
    []
  )

  const formatAmount = (value: number) => `$${numberFormatter.format(value)}`
  const formatAmountWhole = (value: number) =>
    `$${numberFormatterWhole.format(value)}`

  const [rawValue, setRawValue] = React.useState("10000")

  const parsed = Number(rawValue.replace(/[^0-9.]/g, ""))
  const amount = Number.isFinite(parsed) ? parsed : 0
  const eligible = amount >= MIN_AMOUNT

  const deposit = amount * DEPOSIT_RATE
  const balance = amount - deposit
  const monthly = balance / MONTHS

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" {...props}>
            {children ?? (
              <>
                <Calculator className="size-4" />
                {t("title")}
              </>
            )}
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl capitalize">
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="financing-amount" className="text-xs uppercase">
              {t("amountLabel")}
            </Label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <span className="text-sm">$</span>
              </InputGroupAddon>
              <InputGroupInput
                id="financing-amount"
                inputMode="decimal"
                placeholder={t("amountPlaceholder")}
                value={rawValue}
                onChange={(event) => setRawValue(event.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <span className="text-xs uppercase">{t("currency")}</span>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="divide-y divide-border border-y border-border">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-4">
              <p className="text-xs text-muted-foreground uppercase">
                {t("depositLabel")}
              </p>
              <p className="font-heading text-2xl text-foreground">
                {eligible ? formatAmount(deposit) : "—"}
              </p>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-4">
              <p className="text-xs text-muted-foreground uppercase">
                {t("monthlyLabel")}
              </p>
              <p className="font-heading text-2xl text-foreground">
                {eligible ? formatAmount(monthly) : "—"}
              </p>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-4">
              <p className="text-xs text-muted-foreground uppercase">
                {t("durationLabel")}
              </p>
              <p className="font-heading text-2xl text-foreground">
                {eligible ? formatAmount(balance) : "—"}
              </p>
            </div>
          </div>

          {eligible ? (
            <p className="text-xs text-muted-foreground uppercase">
              {t("totalLine", { total: formatAmountWhole(amount) })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground uppercase">
              {t("minimumNote", { min: formatAmountWhole(MIN_AMOUNT) })}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
