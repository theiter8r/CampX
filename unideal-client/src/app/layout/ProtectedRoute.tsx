import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Route wrapper that:
 * 1. Redirects unauthenticated users to sign-in (via redirect param)
 * 2. Redirects users who haven't completed onboarding to /onboarding
 *    (skipping the onboarding route itself to prevent infinite loops)
 */
export function ProtectedRoute() {
  const { isLoaded, isSignedIn, user } = useAuth()
  const { pathname } = useLocation()

  // Wait for auth to initialise
  if (!isLoaded) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isSignedIn) {
    // Preserve the intended destination via ?redirect_url
    const redirectUrl = encodeURIComponent(pathname)
    return <Navigate to={`/sign-in?redirect_url=${redirectUrl}`} replace />
  }

  const onboardingComplete = user?.onboardingComplete ?? false

  if (!onboardingComplete && pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
