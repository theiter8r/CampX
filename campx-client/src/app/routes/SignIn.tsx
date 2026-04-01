// ============================================
// Sign In Page — Email / Password
// ============================================

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { motion } from "framer-motion"
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Building2,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { ApiError } from "@/lib/api"
import { ROUTES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type SignInForm = z.infer<typeof signInSchema>

export function SignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInForm) => {
    try {
      await login(data)
      toast.success("Welcome back!")
      navigate(ROUTES.BROWSE, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_NOT_VERIFIED") {
          toast.error("Please verify your email first. Check your inbox.")
        } else {
          toast.error(err.message)
        }
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    }
  }

  const trustHighlights = [
    {
      icon: ShieldCheck,
      title: "Verified campus community",
      description: "Buy and sell with students from trusted colleges.",
    },
    {
      icon: Building2,
      title: "Hyper-local discovery",
      description: "Find listings near your campus in minutes.",
    },
    {
      icon: Sparkles,
      title: "Fast, secure access",
      description: "Jump back into chats, orders, and favorites instantly.",
    },
  ]

  return (
    <div className="relative isolate overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -right-10 bottom-12 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-[72vh] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="hidden lg:block"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Student Marketplace Network
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white xl:text-5xl">
            Welcome back to your trusted campus marketplace.
          </h1>
          <p className="mt-4 max-w-lg text-base text-zinc-300">
            Continue where you left off and discover listings, chat with sellers,
            and manage your transactions in one place.
          </p>

          <div className="mt-8 space-y-3">
            {trustHighlights.map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.35 }}
                className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-[#101a2a]/65 p-3"
              >
                <span className="mt-0.5 rounded-lg bg-cyan-400/15 p-2 text-cyan-300">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{title}</p>
                  <p className="text-xs text-zinc-400">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.06 }}
          className="relative"
        >
          <div className="rounded-2xl border border-cyan-300/20 bg-[#101a2a]/90 p-5 shadow-[0_25px_60px_rgba(3,8,20,0.65)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 space-y-2 text-center sm:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure Login
              </p>
              <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
              <p className="text-sm text-zinc-400">
                Sign in to your CampX account
              </p>
            </div>

            <div className="mb-5 flex flex-wrap gap-2 lg:hidden">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                Verified Sellers
              </span>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                Escrow Protected
              </span>
              <span className="rounded-full border border-zinc-600/50 bg-zinc-700/25 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                Campus Only
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.ac.in"
                  className="border-zinc-700 bg-zinc-900/85 text-white placeholder:text-zinc-500 focus:border-primary"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="border-zinc-700 bg-zinc-900/85 pr-10 text-white placeholder:text-zinc-500 focus:border-primary"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary-gradient"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Sign In
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link
                to={ROUTES.SIGN_UP}
                className="font-medium text-primary hover:text-primary/80"
              >
                Sign up
              </Link>
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
