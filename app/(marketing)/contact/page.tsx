"use client"

import * as React from "react"
import { ArrowRight, Phone } from "lucide-react"
import { toast } from "sonner"

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

import { submitContactForm } from "./actions"

const buildOptions = [
  "Website",
  "Mobile App",
  "SaaS Product",
  "AI Integration",
  "Not sure yet",
] as const

const budgetOptions = [
  "Under $1K",
  "$1K-$5K",
  "$5K-$15K",
  "$15K+",
  "Monthly plan",
] as const

function formatPhone(digits: string) {
  const d = digits.slice(0, 10)
  if (d.length === 0) return ""
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

const howWeStart = [
  {
    value: "Free",
    label: "20-min call ▪ No pitch, no pressure",
  },
  {
    value: "0%",
    label: "Financing on $5K+ ▪ 12 months, no interest",
  },
  {
    value: "Fixed",
    label: "Price and timeline locked before we start",
  },
] as const

export default function ContactPage() {
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
      toast.error("Couldn't send inquiry", { description: result.error })
      setSubmitting(false)
      return
    }

    toast.success("Inquiry received.", {
      description: "We respond within 24 hours.",
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
    <>
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
                className="text-overline rounded-none border-border bg-transparent px-3 py-1 tracking-badge text-muted-foreground uppercase"
              >
                Contact
              </Badge>
            </RevealItem>

            <RevealItem className="space-y-5" y={26}>
              <h1 className="leading-hero font-heading text-5xl font-normal tracking-tight text-foreground capitalize sm:text-6xl md:text-7xl">
                <span className="block">Let&apos;s build</span>
                <span className="block">something.</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Book a free 20-minute discovery call, or send an inquiry —
                we respond within 24 hours.
              </p>
            </RevealItem>

            <RevealItem y={28}>
              <BookCallButton
                size="lg"
                className="group tracking-wider"
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
                Book a discovery call
                <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" />
              </BookCallButton>
            </RevealItem>

            <RevealItem y={20} className="mt-auto pt-4">
              <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
                {howWeStart.map((item) => (
                  <div
                    key={item.label}
                    className="flex h-full flex-col justify-between gap-6 bg-background p-6"
                  >
                    <p className="font-heading text-4xl leading-none text-foreground sm:text-5xl">
                      {item.value}
                    </p>
                    <p className="text-xs tracking-ui text-muted-foreground uppercase">
                      {item.label}
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
                <p className="text-overline tracking-banner text-muted-foreground uppercase">
                  Inquiry form
                </p>
                <h2 className="leading-form-title font-heading text-3xl tracking-tight text-foreground capitalize">
                  Tell us about it
                </h2>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel
                    htmlFor="name"
                    className="text-xs tracking-ui uppercase"
                  >
                    Your name
                  </FieldLabel>
                  <NameInput
                    id="name"
                    name="name"
                    required
                    placeholder="Jane Smith"
                    groupClassName="rounded-none"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="email"
                    className="text-xs tracking-ui uppercase"
                  >
                    Email
                  </FieldLabel>
                  <EmailInput
                    id="email"
                    name="email"
                    required
                    placeholder="jane@company.com"
                    groupClassName="rounded-none"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="phone"
                    className="text-xs tracking-ui uppercase"
                  >
                    Phone
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
                      placeholder="(555) 123-4567"
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
                  <FieldLabel
                    htmlFor="business"
                    className="text-xs tracking-ui uppercase"
                  >
                    Business <span className="text-muted-foreground normal-case">(optional)</span>
                  </FieldLabel>
                  <BusinessInput
                    id="business"
                    name="business"
                    placeholder="Greenfield Eats"
                    groupClassName="rounded-none"
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-xs tracking-ui uppercase">
                    What are you looking to build?
                  </FieldLabel>
                  <Select
                    value={projectType}
                    onValueChange={handleProjectTypeChange}
                  >
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectGroup>
                        <SelectLabel>Project type</SelectLabel>
                        {buildOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel className="text-xs tracking-ui uppercase">
                    Budget range
                  </FieldLabel>
                  <Select
                    value={budgetRange}
                    onValueChange={handleBudgetRangeChange}
                  >
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="Choose a range" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectGroup>
                        <SelectLabel>Budget range</SelectLabel>
                        {budgetOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="projectDetails"
                    className="text-xs tracking-ui uppercase"
                  >
                    Tell us about your project
                  </FieldLabel>
                  <Textarea
                    id="projectDetails"
                    name="projectDetails"
                    rows={5}
                    required
                    placeholder="What are you building, who is it for, and what should it achieve?"
                    className="rounded-none"
                    value={projectDetails}
                    onChange={(event) => setProjectDetails(event.target.value)}
                  />
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="group w-full tracking-wider"
                >
                  {submitting ? "Sending..." : "Send inquiry"}
                  {!submitting && (
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" />
                  )}
                </Button>
              </FieldGroup>
            </form>
          </Reveal>
        </div>
      </Section>
    </>
  )
}
