import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { motion } from "framer-motion"
import { LogOut, Menu, Plus, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VerificationBadge } from "@/components/ui/VerificationBadge"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { MobileNav } from "./MobileNav"
import { useState } from "react"
import { ROUTES } from "@/lib/constants"

const APP_NAV_LINKS = [
  { href: ROUTES.BROWSE, label: "Browse" },
  { href: ROUTES.DASHBOARD, label: "Dashboard" },
  { href: ROUTES.FAVORITES, label: "Favorites" },
  { href: ROUTES.WALLET, label: "Wallet" },
]

const LANDING_SECTION_LINKS = [
  { href: `${ROUTES.HOME}#recent-listings`, label: "Recently Listed" },
  { href: `${ROUTES.HOME}#categories`, label: "Categories" },
  { href: `${ROUTES.HOME}#why-campx`, label: "Why CampX" },
  { href: `${ROUTES.HOME}#how-it-works`, label: "How It Works" },
]

const DESKTOP_LINKS = [...APP_NAV_LINKS, ...LANDING_SECTION_LINKS]

/** Top navigation bar — responsive, auth-aware */
export function Navbar() {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const verificationStatus = user?.verificationStatus ?? "UNVERIFIED"

  return (
    <>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="font-brand text-2xl font-bold text-foreground hover:text-primary transition-colors"
          >
            CampX
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {DESKTOP_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {!isLoading && isAuthenticated ? (
              <>
                {/* Sell button */}
                <Button
                  size="sm"
                  onClick={() => navigate(ROUTES.SELL)}
                  className="hidden sm:flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  Sell
                </Button>

                {/* Notification bell */}
                <div className="hidden sm:block">
                  <NotificationBell />
                </div>

                {/* Verification badge */}
                <VerificationBadge
                  status={verificationStatus as "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"}
                  size="sm"
                />

                {/* User avatar dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full ring-2 ring-border focus:outline-none focus:ring-primary">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.fullName ?? ""} />
                        <AvatarFallback>
                          {(user?.fullName ?? "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE(user?.id ?? ""))}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={async () => {
                        await logout()
                        navigate(ROUTES.HOME)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : !isLoading ? (
              <>
                <Link to={ROUTES.SIGN_IN}>
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to={ROUTES.SIGN_UP}>
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : null}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile slide-out drawer */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
