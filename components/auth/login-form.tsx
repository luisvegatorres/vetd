'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

const OTP_LENGTH = 8
// Keep in sync with Supabase: Auth → Providers → Email → "Email OTP Expiration".
const OTP_EXPIRES_IN_SECONDS = 300

type Step = 'email' | 'code'

function formatRemaining(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const inputOtpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step !== 'code' || sentAt === null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [step, sentAt])

  const elapsed = sentAt ? Math.floor((now - sentAt) / 1000) : 0
  const remaining = Math.max(0, OTP_EXPIRES_IN_SECONDS - elapsed)
  const expired = sentAt !== null && remaining === 0
  const progressValue = (remaining / OTP_EXPIRES_IN_SECONDS) * 100

  const sendCode = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    setIsLoading(false)
    if (error) {
      setError(error.message)
      return false
    }
    setSentAt(Date.now())
    setNow(Date.now())
    return true
  }

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await sendCode()) setStep('code')
  }

  const resendCode = async () => {
    setCode('')
    await sendCode()
    inputOtpRef.current?.focus()
  }

  const verifyCode = async (token: string) => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      setIsLoading(false)
      setError(error.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <CardDescription>
            {step === 'email'
              ? 'Enter your email to receive a one-time code.'
              : `We sent a code to ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={requestCode}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <Mail aria-hidden />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </InputGroup>
                </div>
                {error && <p className="text-sm text-destructive-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending code...' : 'Send code'}
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (code.length === OTP_LENGTH && !expired) verifyCode(code)
              }}
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="code">One-time code</Label>
                  <InputOTP
                    ref={inputOtpRef}
                    id="code"
                    maxLength={OTP_LENGTH}
                    value={code}
                    onChange={setCode}
                    onComplete={verifyCode}
                    autoFocus
                    disabled={isLoading || expired}
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="flex flex-col gap-2">
                  <Progress value={progressValue} />
                  <p className="text-xs text-muted-foreground">
                    {expired
                      ? 'Code expired. Request a new one.'
                      : `Expires in ${formatRemaining(remaining)}`}
                  </p>
                </div>
                {error && <p className="text-sm text-destructive-500">{error}</p>}
                {expired ? (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={resendCode}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send a new code'}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || code.length !== OTP_LENGTH}
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('email')
                    setCode('')
                    setError(null)
                    setSentAt(null)
                  }}
                  disabled={isLoading}
                >
                  Use a different email
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
