import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/dashboard/page-header'
import { CreateUserForm } from './create-user-form'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user!.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Invite user"
        description="Creates an account so they can sign in via one-time code."
      />
      <div className="mt-10">
        <CreateUserForm />
      </div>
    </>
  )
}
