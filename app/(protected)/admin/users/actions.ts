'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type UserRole = Database['public']['Enums']['user_role']

const VALID_ROLES: UserRole[] = ['admin', 'editor', 'sales_rep', 'viewer']

export type CreateUserResult = { ok: true } | { ok: false; error: string }

export async function createUserAction(formData: FormData): Promise<CreateUserResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const fullName = String(formData.get('full_name') ?? '').trim()
  const roleInput = String(formData.get('role') ?? '') as UserRole

  if (!email) return { ok: false, error: 'Email is required.' }
  if (!VALID_ROLES.includes(roleInput)) return { ok: false, error: 'Invalid role.' }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { ok: false, error: 'Not authenticated.' }

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single()

  if (caller?.role !== 'admin') {
    return { ok: false, error: 'Only admins can create users.' }
  }

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  })

  if (createError || !created.user) {
    return { ok: false, error: createError?.message ?? 'Failed to create user.' }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ role: roleInput, full_name: fullName || null })
    .eq('id', created.user.id)

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  revalidatePath('/admin/users')
  return { ok: true }
}
