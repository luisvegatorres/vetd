"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail } from "lucide-react"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  )
}

const OTP_LENGTH = 8
// Keep in sync with Supabase: Auth → Providers → Email → "Email OTP Expiration".
const OTP_EXPIRES_IN_SECONDS = 300

type Step = "email" | "code"

function formatRemaining(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(() =>
    searchParams.get("error") === "oauth"
      ? "Google sign-in failed. Try again or use an email code."
      : null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const inputOtpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step !== "code" || sentAt === null) return
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
    if (await sendCode()) setStep("code")
  }

  const signInWithGoogle = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setIsLoading(false)
      setError(error.message)
    }
  }

  const resendCode = async () => {
    setCode("")
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
      type: "email",
    })

    if (error) {
      setIsLoading(false)
      setError(error.message)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email to receive a one-time code."
              : `We sent a code to ${email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <div className="flex flex-col gap-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={signInWithGoogle}
                disabled={isLoading}
              >
                <GoogleIcon className="size-4" />
                Continue with Google
              </Button>
              <div className="relative">
                <Separator />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground uppercase">
                  or
                </span>
              </div>
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
                  {error && (
                    <p className="text-destructive-500 text-sm">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending code..." : "Send code"}
                  </Button>
                </div>
              </form>
            </div>
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
                      ? "Code expired. Request a new one."
                      : `Expires in ${formatRemaining(remaining)}`}
                  </p>
                </div>
                {error && (
                  <p className="text-destructive-500 text-sm">{error}</p>
                )}
                {expired ? (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={resendCode}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send a new code"}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || code.length !== OTP_LENGTH}
                  >
                    {isLoading ? "Verifying..." : "Verify"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("email")
                    setCode("")
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
