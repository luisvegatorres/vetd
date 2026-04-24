"use client"

import * as React from "react"
import { ArrowRight, Phone } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { submitContactForm } from "@/app/[locale]/(marketing)/contact/actions"
import { BookCallButton } from "@/components/actions/book-call-button"
import { BusinessInput } from "@/components/forms/business-input"
import { EmailInput } from "@/components/forms/email-input"
import { NameInput } from "@/components/forms/name-input"
import { Section } from "@/components/layout/section"
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const buildKeys = ["website", "mobile", "saas", "ai", "unsure"] as const
const budgetKeys = ["u1k", "1k5k", "5k15k", "15kplus", "monthly"] as const
const highlightKeys = ["free", "financing", "fixed"] as const

function formatPhone(digits: string) {
  const d = digits.slice(0, 10)
  if (d.length === 0) return ""
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export function ContactForm() {
  const t = useTranslations("contact")
  const tForm = useTranslations("contact.form")
  const tBuild = useTranslations("contact.form.buildOptions")
  const tBudget = useTranslations("contact.form.budgetOptions")
  const tHighlights = useTranslations("contact.highlights")
  const tToast = useTranslations("contact.toast")

  const [projectType, setProjectType] = React.useState<string>("")
  const [budgetRange, setBudgetRange] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [projectDetails, setProjectDetails] = React.useState("")

  function handleProjectTypeChange(value: string | null) {
    setProjectType(value ?? "")
  }

  function handleBudgetRangeChange(value: string | null) {
    setBudgetRange(value ?? "")
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    const form = event.currentTarget
    const data = new FormData(form)
    data.set("projectType", projectType)
    data.set("budgetRange", budgetRange)

    const result = await submitContactForm(data)

    if (!result.ok) {
      toast.error(tToast("errorTitle"), { description: result.error })
      setSubmitting(false)
      return
    }

    toast.success(tToast("successTitle"), {
      description: tToast("successDescription"),
    })

    form.reset()
    setProjectType("")
    setBudgetRange("")
    setName("")
    setEmail("")
    setPhone("")
    setProjectDetails("")
    setSubmitting(false)
  }

  return (
    <Section size="md">
      <div className="contact-split-grid grid items-stretch gap-12">
        <RevealGroup
          className="flex h-full flex-col gap-8 lg:pt-6"
          delayChildren={0.1}
          stagger={0.08}
        >
          <RevealItem y={18}>
            <Badge
              variant="outline"
              className="rounded-none border-border bg-transparent px-3 py-1 text-muted-foreground uppercase"
            >
              {t("badge")}
            </Badge>
          </RevealItem>

          <RevealItem className="space-y-5" y={26}>
            <h1 className="leading-hero font-heading text-5xl font-normal text-foreground capitalize sm:text-6xl md:text-7xl">
              <span className="block">{t("headlineLine1")}</span>
              <span className="block">{t("headlineLine2")}</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("subhead")}
            </p>
          </RevealItem>

          <RevealItem y={28}>
            <BookCallButton
              size="lg"
              className="group"
              prefill={{
                name: name || undefined,
                email: email || undefined,
                responses: {
                  project_type: projectType || undefined,
                  budget_range: budgetRange || undefined,
                  project_details: projectDetails || undefined,
                },
              }}
            >
              {t("bookButton")}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" />
            </BookCallButton>
          </RevealItem>

          <RevealItem y={20} className="mt-auto pt-4">
            <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
              {highlightKeys.map((key) => (
                <div
                  key={key}
                  className="flex h-full flex-col justify-between gap-6 bg-background p-6"
                >
                  <p className="font-heading text-4xl leading-none text-foreground sm:text-5xl">
                    {tHighlights(`${key}Value`)}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase">
                    {tHighlights(`${key}Label`)}
                  </p>
                </div>
              ))}
            </div>
          </RevealItem>
        </RevealGroup>

        <Reveal
          className="bg-card ring-1 ring-border"
          delay={0.18}
          x={28}
          y={20}
        >
          <form
            onSubmit={onSubmit}
            className="flex h-full flex-col gap-8 p-8 sm:p-10"
            id="inquiry-form"
          >
            <div className="space-y-2">
              <p className="text-overline text-muted-foreground uppercase">
                {tForm("eyebrow")}
              </p>
              <h2 className="leading-form-title font-heading text-3xl text-foreground capitalize">
                {tForm("title")}
              </h2>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name" className="text-xs uppercase">
                  {tForm("name")}
                </FieldLabel>
                <NameInput
                  id="name"
                  name="name"
                  required
                  placeholder={tForm("namePlaceholder")}
                  groupClassName="rounded-none"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email" className="text-xs uppercase">
                  {tForm("email")}
                </FieldLabel>
                <EmailInput
                  id="email"
                  name="email"
                  required
                  placeholder={tForm("emailPlaceholder")}
                  groupClassName="rounded-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="phone" className="text-xs uppercase">
                  {tForm("phone")}
                </FieldLabel>
                <InputGroup className="rounded-none">
                  <InputGroupAddon>
                    <Phone aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    placeholder={tForm("phonePlaceholder")}
                    maxLength={14}
                    value={formatPhone(phone)}
                    onChange={(event) =>
                      setPhone(
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                  />
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="business" className="text-xs uppercase">
                  {tForm("business")}{" "}
                  <span className="text-muted-foreground normal-case">
                    {tForm("optional")}
                  </span>
                </FieldLabel>
                <BusinessInput
                  id="business"
                  name="business"
                  placeholder={tForm("businessPlaceholder")}
                  groupClassName="rounded-none"
                />
              </Field>

              <Field>
                <FieldLabel className="text-xs uppercase">
                  {tForm("projectType")}
                </FieldLabel>
                <Select
                  value={projectType}
                  onValueChange={handleProjectTypeChange}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder={tForm("projectTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectGroup>
                      <SelectLabel>{tForm("projectTypeLabel")}</SelectLabel>
                      {buildKeys.map((key) => (
                        <SelectItem key={key} value={tBuild(key)}>
                          {tBuild(key)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel className="text-xs uppercase">
                  {tForm("budget")}
                </FieldLabel>
                <Select
                  value={budgetRange}
                  onValueChange={handleBudgetRangeChange}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder={tForm("budgetPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectGroup>
                      <SelectLabel>{tForm("budget")}</SelectLabel>
                      {budgetKeys.map((key) => (
                        <SelectItem key={key} value={tBudget(key)}>
                          {tBudget(key)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="projectDetails"
                  className="text-xs uppercase"
                >
                  {tForm("details")}
                </FieldLabel>
                <Textarea
                  id="projectDetails"
                  name="projectDetails"
                  rows={5}
                  required
                  placeholder={tForm("detailsPlaceholder")}
                  className="rounded-none"
                  value={projectDetails}
                  onChange={(event) => setProjectDetails(event.target.value)}
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="group w-full"
              >
                {submitting ? tForm("submitting") : tForm("submit")}
                {!submitting && (
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" />
                )}
              </Button>
            </FieldGroup>
          </form>
        </Reveal>
      </div>
    </Section>
  )
}
