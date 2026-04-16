"use client"

import * as React from "react"
import { Calendar, Mail, MessageCircle, Timer } from "lucide-react"
import { toast } from "sonner"

import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { site } from "@/lib/site"
import { whatsappHref } from "@/lib/whatsapp"

const buildOptions = [
  "Marketing Website",
  "Mobile App",
  "Web App",
  "Growth System",
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

export default function ContactPage() {
  const [projectType, setProjectType] = React.useState<string>("")
  const [budgetRange, setBudgetRange] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState(false)

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
    const payload = {
      name: data.get("name"),
      company: data.get("company"),
      email: data.get("email"),
      projectType,
      projectDetails: data.get("projectDetails"),
      budgetRange,
    }

    console.log("[contact-form]", payload)
    await new Promise((resolve) => setTimeout(resolve, 350))

    toast.success("Inquiry received.", {
      description: "We respond within 24 hours.",
    })

    form.reset()
    setProjectType("")
    setBudgetRange("")
    setSubmitting(false)
  }

  return (
    <>
      <Section size="md">
        <div className="max-w-3xl space-y-6">
          <Badge
            variant="outline"
            className="rounded-none border-primary/50 bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-primary uppercase"
          >
            Contact
          </Badge>
          <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-6xl">
            Let&apos;s build something.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Tell us about your project. We respond within 24 hours.
          </p>
        </div>
      </Section>

      <Section eyebrow="Inquiry form">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <form
            onSubmit={onSubmit}
            className="border-t-2 border-primary bg-card p-8 ring-1 ring-border"
          >
            <div className="mb-6 space-y-2">
              <h2 className="font-heading text-3xl tracking-tight text-foreground uppercase">
                Project inquiry
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Share the essentials and we&apos;ll come back with the right
                next step.
              </p>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel
                  htmlFor="name"
                  className="text-xs tracking-[0.18em] uppercase"
                >
                  Your name
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Jane Smith"
                  className="h-11 rounded-none"
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="company"
                  className="text-xs tracking-[0.18em] uppercase"
                >
                  Company or business name (optional)
                </FieldLabel>
                <Input
                  id="company"
                  name="company"
                  placeholder="Acme Health"
                  className="h-11 rounded-none"
                />
              </Field>

              <Field>
                <FieldLabel
                  htmlFor="email"
                  className="text-xs tracking-[0.18em] uppercase"
                >
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="jane@company.com"
                  className="h-11 rounded-none"
                />
              </Field>

              <Field>
                <FieldLabel className="text-xs tracking-[0.18em] uppercase">
                  What are you looking to build?
                </FieldLabel>
                <Select
                  value={projectType}
                  onValueChange={handleProjectTypeChange}
                >
                  <SelectTrigger className="h-11 w-full rounded-none">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectGroup>
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
                <FieldLabel
                  htmlFor="projectDetails"
                  className="text-xs tracking-[0.18em] uppercase"
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
                />
              </Field>

              <Field>
                <FieldLabel className="text-xs tracking-[0.18em] uppercase">
                  Budget range
                </FieldLabel>
                <Select
                  value={budgetRange}
                  onValueChange={handleBudgetRangeChange}
                >
                  <SelectTrigger className="h-11 w-full rounded-none">
                    <SelectValue placeholder="Choose a range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectGroup>
                      {budgetOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full rounded-none bg-primary tracking-[0.18em] text-primary-foreground uppercase hover:bg-primary/85"
              >
                {submitting ? "Sending..." : "Send inquiry"}
              </Button>
            </FieldGroup>
          </form>

          <div className="flex flex-col gap-4">
            <ContactRow
              icon={Calendar}
              label="Book a free 20-min discovery call"
              value="Open scheduling link"
              href={site.discoveryCallHref}
            />
            <ContactRow
              icon={Mail}
              label="Email"
              value={site.email}
              href={`mailto:${site.email}`}
            />
            <ContactRow
              icon={MessageCircle}
              label="WhatsApp"
              value={site.whatsappDisplay}
              href={whatsappHref("Hi, I'd like to talk about a project.")}
            />
            <ContactRow
              icon={Timer}
              label="Response time"
              value={site.responseTime}
            />
          </div>
        </div>
      </Section>
    </>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  href?: string
}) {
  const content = (
    <>
      <span className="inline-flex items-center gap-3">
        <Icon className="size-4 text-primary" />
        <span className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
          {label}
        </span>
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </>
  )

  const baseClass =
    "flex items-center justify-between gap-6 border-t border-border bg-card p-6 ring-1 ring-border transition-colors"

  if (!href || href === "#") {
    return <div className={baseClass}>{content}</div>
  }

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`${baseClass} hover:text-primary`}
    >
      {content}
    </a>
  )
}
