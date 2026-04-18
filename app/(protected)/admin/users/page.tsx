import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { CreateUserForm } from './create-user-form'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="mx-auto w-full max-w-xl p-6 md:p-10">
      <h1 className="mb-2 text-2xl font-bold">Invite user</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Creates an account so they can sign in via one-time code.
      </p>
      <CreateUserForm />
    </div>
  )
}
