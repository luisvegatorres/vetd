"use client"

import * as React from "react"
import { Calendar, Mail, MessageCircle, Timer } from "lucide-react"
import { toast } from "sonner"

import { Reveal, RevealGroup, RevealItem } from "@/components/reveal"
import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item"
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

type ContactItem = {
  icon: React.ElementType
  label: string
  value: string
  href?: string
}

const contactItems: ContactItem[] = [
  {
    icon: Calendar,
    label: "Book a free 20-min discovery call",
    value: "Open scheduling link",
    href: site.discoveryCallHref,
  },
  {
    icon: Mail,
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: site.whatsappDisplay,
    href: whatsappHref("Hi, I'd like to talk about a project."),
  },
  {
    icon: Timer,
    label: "Response time",
    value: site.responseTime,
  },
]

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
        <RevealGroup className="max-w-3xl space-y-6" delayChildren={0.08}>
          <RevealItem y={18}>
            <Badge
              variant="outline"
              className="rounded-none border-border bg-transparent px-3 py-1 text-[10px] tracking-[0.22em] text-muted-foreground uppercase"
            >
              Contact
            </Badge>
          </RevealItem>
          <RevealItem y={24}>
            <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-foreground uppercase sm:text-6xl">
              Let&apos;s build something.
            </h1>
          </RevealItem>
          <RevealItem y={28}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Tell us about your project. We respond within 24 hours.
            </p>
          </RevealItem>
        </RevealGroup>
      </Section>

      <Section eyebrow="Inquiry form">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <Reveal y={22}>
            <form
              onSubmit={onSubmit}
              className="border-t border-border bg-card p-8 ring-1 ring-border"
            >
              <div className="mb-6 space-y-2">
                <h2 className="font-heading text-3xl leading-[1.1] tracking-tight text-foreground uppercase">
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
                    className="rounded-none"
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
                  className="w-full rounded-none tracking-[0.18em] uppercase"
                >
                  {submitting ? "Sending..." : "Send inquiry"}
                </Button>
              </FieldGroup>
            </form>
          </Reveal>

          <RevealGroup delayChildren={0.08} stagger={0.06}>
            <ItemGroup className="gap-5">
              {contactItems.map((item) => {
                const isExternal = item.href?.startsWith("http")
                const Icon = item.icon

                return (
                  <RevealItem key={item.label} y={16}>
                    <Item
                      variant="outline"
                      className="gap-5 px-6 py-6"
                      render={
                        item.href ? (
                          <a
                            href={item.href}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noopener noreferrer" : undefined}
                          />
                        ) : undefined
                      }
                    >
                      <ItemMedia
                        variant="icon"
                        className="text-muted-foreground transition-colors group-hover/item:text-foreground [&_svg:not([class*='size-'])]:size-7"
                      >
                        <Icon />
                      </ItemMedia>

                      <ItemContent className="gap-1.5">
                        <ItemTitle className="text-lg leading-snug">
                          {item.label}
                        </ItemTitle>
                        <ItemDescription className="text-base">
                          {item.value}
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                  </RevealItem>
                )
              })}
            </ItemGroup>
          </RevealGroup>
        </div>
      </Section>
    </>
  )
}
