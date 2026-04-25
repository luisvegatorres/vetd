"use client"

import { useState, type ReactNode } from "react"

import Link from "next/link"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TabValue = "documents" | "templates" | "outreach"

interface DocumentsTabsProps {
  canManageOutreach: boolean
  documentsPanel: ReactNode
  templatesPanel: ReactNode
  outreachPanel: ReactNode
}

export function DocumentsTabs({
  canManageOutreach,
  documentsPanel,
  templatesPanel,
  outreachPanel,
}: DocumentsTabsProps) {
  const [tab, setTab] = useState<TabValue>("documents")

  const action =
    tab === "outreach" ? (
      canManageOutreach ? (
        <Button
          nativeButton={false}
          render={<Link href="/documents/outreach/new" />}
        >
          <Plus aria-hidden className="size-4" />
          New outreach template
        </Button>
      ) : null
    ) : (
      <Button
        nativeButton={false}
        render={<Link href="/documents/templates/new" />}
      >
        <Plus aria-hidden className="size-4" />
        New template
      </Button>
    )

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="documents">Generated</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
        </TabsList>
        {action}
      </div>
      <TabsContent value="documents" className="mt-6">
        {documentsPanel}
      </TabsContent>
      <TabsContent value="templates" className="mt-6">
        {templatesPanel}
      </TabsContent>
      <TabsContent value="outreach" className="mt-6">
        {outreachPanel}
      </TabsContent>
    </Tabs>
  )
}
