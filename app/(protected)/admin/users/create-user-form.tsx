'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUserAction } from './actions'

export function CreateUserForm() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      action={(formData) => {
        setError(null)
        startTransition(async () => {
          const result = await createUserAction(formData)
          if (result.ok) {
            toast.success('User created. They can now sign in.')
            const form = document.getElementById('create-user-form') as HTMLFormElement | null
            form?.reset()
          } else {
            setError(result.error)
          }
        })
      }}
      id="create-user-form"
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" type="text" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue="viewer"
          required
          className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs"
        >
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="sales_rep">Sales rep</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      {error && <p className="text-sm text-destructive-500">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create user'}
      </Button>
    </form>
  )
}
