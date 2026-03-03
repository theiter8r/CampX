// ============================================
// Forgot Password Page — request password reset email
// ============================================

import { useState } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/lib/constants"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})
type Values = z.infer<typeof schema>

export function ForgotPassword() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Values) => {
    try {
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })
      // Always show success to prevent enumeration
      setSent(true)
    } catch {
      setError("root", { message: "Network error. Please try again." })
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121212] p-8 text-center shadow-xl">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h2 className="text-xl font-bold text-white">Check your inbox</h2>
          <p className="mt-2 text-sm text-zinc-400">
            If an account exists for{" "}
            <span className="font-medium text-zinc-200">{getValues("email")}</span>,
            you&apos;ll receive a password reset link shortly.
          </p>
          <Link to={ROUTES.SIGN_IN}>
            <Button variant="ghost" className="mt-6 w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121212] p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="email"
                type="email"
                placeholder="you@college.edu"
                className="pl-10"
                autoComplete="email"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-sm text-red-400">{errors.root.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending…
              </span>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Remember your password?{" "}
          <Link to={ROUTES.SIGN_IN} className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
