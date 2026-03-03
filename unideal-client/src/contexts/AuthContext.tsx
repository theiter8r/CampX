// ============================================
// AuthContext — Custom JWT authentication context
// Replaces @clerk/clerk-react for auth state management
// ============================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001"
const TOKEN_KEY = "unideal_token"

export interface AuthUserInfo {
  id: string
  email: string
  fullName: string
  avatarUrl?: string | null
  isAdmin: boolean
  verificationStatus: string
  onboardingComplete: boolean
}

interface LoginResponse {
  token: string
  user: AuthUserInfo
}

interface AuthContextValue {
  user: AuthUserInfo | null
  isSignedIn: boolean
  /** true once the initial token check has completed */
  isLoaded: boolean
  /** Returns the stored JWT, or null if not signed in */
  getToken: () => Promise<string | null>
  /** Sign in with email + password. Throws on failure. */
  login: (email: string, password: string) => Promise<void>
  /** Clear auth state and token */
  logout: () => void
  /** Update local user info (e.g. after onboarding) */
  setUser: (user: AuthUserInfo) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Fetch the current user's profile using a stored token */
async function fetchUserProfile(token: string): Promise<AuthUserInfo | null> {
  try {
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data ?? null) as AuthUserInfo | null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUserInfo | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // On mount: check for an existing token and restore session
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setIsLoaded(true)
      return
    }

    fetchUserProfile(token).then((profile) => {
      if (profile) {
        setUserState(profile)
      } else {
        // Token is invalid/expired — clear it
        localStorage.removeItem(TOKEN_KEY)
      }
      setIsLoaded(true)
    })
  }, [])

  const getToken = useCallback(async (): Promise<string | null> => {
    return localStorage.getItem(TOKEN_KEY)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const json = await res.json()

    if (!res.ok) {
      throw new Error(json?.error ?? "Login failed")
    }

    const { token, user: userInfo } = json.data as LoginResponse
    localStorage.setItem(TOKEN_KEY, token)
    setUserState(userInfo)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUserState(null)
  }, [])

  const setUser = useCallback((updated: AuthUserInfo) => {
    setUserState(updated)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignedIn: !!user,
        isLoaded,
        getToken,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/** Hook to access auth state. Must be used inside <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
