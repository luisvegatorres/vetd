"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { BookCallButton } from "@/components/book-call-button"
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal"
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

const howWeStart = [
  {
    value: "20 min",
    label: "Free discovery call · No pitch",
  },
  {
    value: "24 hr",
    label: "Response time, usually same day",
  },
  {
    value: "Fixed",
    label: "Scope, timeline, and price up front",
  },
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
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <RevealGroup
            className="space-y-8 lg:pt-6"
            delayChildren={0.1}
            stagger={0.08}
          >
            <RevealItem y={18}>
              <Badge
                variant="outline"
                className="rounded-none border-border bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-muted-foreground uppercase"
              >
                Contact
              </Badge>
            </RevealItem>

            <RevealItem className="space-y-5" y={26}>
              <h1 className="font-heading text-5xl leading-[0.95] font-normal tracking-tight text-foreground uppercase sm:text-6xl md:text-7xl">
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
                className="group rounded-none tracking-[0.14em] uppercase"
              >
                Book a discovery call
                <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-1" />
              </BookCallButton>
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
                <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
                  / 001 — Inquiry form
                </p>
                <h2 className="font-heading text-3xl leading-[1.1] tracking-tight text-foreground uppercase">
                  Tell us about it
                </h2>
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
                    className="rounded-none"
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
                    className="rounded-none"
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
                    <SelectTrigger className="w-full rounded-none">
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
                    <SelectTrigger className="w-full rounded-none">
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
                  size="lg"
                  disabled={submitting}
                  className="group w-full rounded-none tracking-[0.18em] uppercase"
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

      <Section eyebrow="/ 002 — How we start" size="md">
        <RevealGroup
          className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3"
          delayChildren={0.08}
          stagger={0.08}
        >
          {howWeStart.map((item) => (
            <RevealItem key={item.label} y={18} className="h-full">
              <div className="flex h-full flex-col justify-between gap-8 bg-background p-8">
                <p className="font-heading text-5xl leading-none text-foreground sm:text-6xl">
                  {item.value}
                </p>
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  {item.label}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>
    </>
  )
}
