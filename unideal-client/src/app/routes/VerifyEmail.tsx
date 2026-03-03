// ============================================
// Verify Email Page — handles token from email link
// ============================================

import { useEffect, useState } from "react"
import { useSearchParams, useNavigate, Link } from "react-router-dom"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import type { AuthUserInfo } from "@/contexts/AuthContext"
import { ROUTES } from "@/lib/constants"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001"

type Status = "loading" | "success" | "error"

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [status, setStatus] = useState<Status>("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setStatus("error")
      setErrorMessage("No verification token found in the URL.")
      return
    }

    fetch(`${API_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const { token: jwtToken, user } = json.data as { token: string; user: AuthUserInfo }
          localStorage.setItem("unideal_token", jwtToken)
          setUser(user)
          setStatus("success")
        } else {
          setStatus("error")
          setErrorMessage(json.error ?? "Verification failed.")
        }
      })
      .catch(() => {
        setStatus("error")
        setErrorMessage("Network error. Please try again.")
      })
  }, [searchParams, setUser])

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121212] p-8 text-center shadow-xl">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-bold text-white">Verifying your email…</h2>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h2 className="text-xl font-bold text-white">Email verified!</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Your account is now active. Let&apos;s complete your profile.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => navigate(ROUTES.ONBOARDING)}
            >
              Complete Setup
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-xl font-bold text-white">Verification failed</h2>
            <p className="mt-2 text-sm text-zinc-400">{errorMessage}</p>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/resend-verification">
                <Button className="w-full">Resend verification email</Button>
              </Link>
              <Link to={ROUTES.SIGN_IN}>
                <Button variant="ghost" className="w-full">Back to Sign In</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
