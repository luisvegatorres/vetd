'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function LogoutButton({
  variant = 'outline',
}: {
  variant?: React.ComponentProps<typeof Button>['variant']
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant={variant}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const supabase = createClient()
          await supabase.auth.signOut()
          router.push('/auth/login')
          router.refresh()
        })
      }
    >
      {pending ? 'Logging out...' : 'Log out'}
    </Button>
  )
}
