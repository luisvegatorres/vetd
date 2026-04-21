import type { Database } from "@/lib/supabase/types"

type ProductType = Database["public"]["Enums"]["project_product_type"]

export type TaskTemplateCategory = "intake" | "build" | "delivery" | "other"

export type NamedTaskTemplate = {
  id: string
  /** Shown in the template picker. */
  label: string
  /** Bucket in the picker's grouped dropdown. */
  category: TaskTemplateCategory
  title: string
  description?: string
  /** Days from today; the picker stamps due_date = today + dueInDays. */
  dueInDays?: number
}

// Shared intake phase — same across product types.
const INTAKE: NamedTaskTemplate[] = [
  {
    id: "intake-proposal",
    label: "Proposal",
    category: "intake",
    title: "Send proposal",
    description: "Draft scope, deliverables, and pricing. Send for client review.",
    dueInDays: 2,
  },
  {
    id: "intake-contract",
    label: "Contract (e-signature)",
    category: "intake",
    title: "Send contract for e-signature",
    description: "Generate SOW/contract and send for signature.",
    dueInDays: 4,
  },
  {
    id: "intake-deposit",
    label: "Stripe deposit invoice",
    category: "intake",
    title: "Send Stripe deposit invoice",
    description:
      "Generate checkout link for the 30% deposit. Project stays in proposal until paid.",
    dueInDays: 5,
  },
  {
    id: "intake-kickoff",
    label: "Kickoff call",
    category: "intake",
    title: "Kickoff call",
    description: "Schedule and run the kickoff once deposit is paid.",
    dueInDays: 7,
  },
]

// Shared delivery phase — same across product types.
const DELIVERY: NamedTaskTemplate[] = [
  {
    id: "delivery-qa",
    label: "Client review & QA",
    category: "delivery",
    title: "Client review & QA",
    description: "Walk the client through the build; collect revisions.",
  },
  {
    id: "delivery-handoff",
    label: "Final invoice & handoff",
    category: "delivery",
    title: "Final invoice & handoff",
    description:
      "Send final Stripe invoice, deliver assets, close the project.",
  },
]

// Product-specific build phase.
const BUILD: Record<ProductType, NamedTaskTemplate[]> = {
  business_website: [
    {
      id: "build-web-assets",
      label: "Collect brand assets",
      category: "build",
      title: "Collect brand assets & copy",
    },
    {
      id: "build-web-mockups",
      label: "Design mockups review",
      category: "build",
      title: "Design mockups review",
    },
    {
      id: "build-web-dev",
      label: "Development (website)",
      category: "build",
      title: "Development",
    },
    {
      id: "build-web-launch",
      label: "Launch & DNS cutover",
      category: "build",
      title: "Launch & DNS cutover",
    },
  ],
  mobile_app: [
    {
      id: "build-mobile-wireframes",
      label: "Wireframes & flows",
      category: "build",
      title: "Wireframes & flows review",
    },
    {
      id: "build-mobile-dev",
      label: "Development (mobile)",
      category: "build",
      title: "Development",
    },
    {
      id: "build-mobile-testflight",
      label: "TestFlight / Play build",
      category: "build",
      title: "TestFlight / Play Console build",
    },
    {
      id: "build-mobile-store",
      label: "Store listing & submission",
      category: "build",
      title: "Store listing & submission",
    },
  ],
  web_app: [
    {
      id: "build-webapp-schema",
      label: "Schema & auth scoping",
      category: "build",
      title: "Schema & auth scoping",
    },
    {
      id: "build-webapp-dev",
      label: "Development (web app)",
      category: "build",
      title: "Development",
    },
    {
      id: "build-webapp-staging",
      label: "Staging deploy",
      category: "build",
      title: "Staging deploy & client review",
    },
    {
      id: "build-webapp-prod",
      label: "Production deploy (web app)",
      category: "build",
      title: "Production deploy",
    },
  ],
  ai_integration: [
    {
      id: "build-ai-keys",
      label: "API access & credentials",
      category: "build",
      title: "API access & credentials",
    },
    {
      id: "build-ai-evals",
      label: "Prompt + evals pass",
      category: "build",
      title: "Prompt + evals pass",
    },
    {
      id: "build-ai-build",
      label: "Integration build",
      category: "build",
      title: "Integration build",
    },
    {
      id: "build-ai-prod",
      label: "Production deploy (AI)",
      category: "build",
      title: "Production deploy",
    },
  ],
}

// Extra one-off templates that aren't part of the default seed, but are useful
// additions reps can pick from when adding a task mid-project.
const EXTRAS: NamedTaskTemplate[] = [
  {
    id: "extra-progress-update",
    label: "Progress update",
    category: "other",
    title: "Send progress update",
    description: "Email client with status, screenshots, and next milestone.",
    dueInDays: 3,
  },
  {
    id: "extra-milestone-invoice",
    label: "Milestone invoice",
    category: "other",
    title: "Send milestone invoice",
    description: "Generate Stripe invoice for the next milestone payment.",
    dueInDays: 5,
  },
  {
    id: "extra-design-review",
    label: "Design review",
    category: "other",
    title: "Design review with client",
    description: "Walk through current designs, capture feedback.",
    dueInDays: 2,
  },
  {
    id: "extra-change-request",
    label: "Change request",
    category: "other",
    title: "Scope change request",
    description:
      "Document requested changes, price the delta, send amended SOW.",
  },
]

/** Flat, deduped list used by the template picker in the New-task dialog. */
export const TASK_LIBRARY: NamedTaskTemplate[] = [
  ...INTAKE,
  ...BUILD.business_website,
  ...BUILD.mobile_app,
  ...BUILD.web_app,
  ...BUILD.ai_integration,
  ...DELIVERY,
  ...EXTRAS,
]

/** Default seed for a newly-created project, ordered intake → build → delivery. */
export function taskTemplateFor(
  productType: ProductType | null,
): NamedTaskTemplate[] {
  const build = productType ? BUILD[productType] : []
  return [...INTAKE, ...build, ...DELIVERY]
}
