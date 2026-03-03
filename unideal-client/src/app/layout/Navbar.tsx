import { Link, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { motion } from "framer-motion"
import { Menu, Plus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VerificationBadge } from "@/components/ui/VerificationBadge"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileNav } from "./MobileNav"
import { useState } from "react"
import { ROUTES } from "@/lib/constants"

const NAV_LINKS = [
  { href: ROUTES.BROWSE, label: "Browse" },
  { href: ROUTES.DASHBOARD, label: "Dashboard" },
  { href: ROUTES.FAVORITES, label: "Favorites" },
  { href: ROUTES.WALLET, label: "Wallet" },
]

/** Top navigation bar — responsive, auth-aware */
export function Navbar() {
  const { isSignedIn, isLoaded, user, logout } = useAuth()
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
            Unideal
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {isSignedIn &&
              NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {isLoaded && isSignedIn ? (
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

                {/* User avatar + dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full ring-2 ring-border focus:outline-none">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.fullName} />
                        <AvatarFallback>
                          {(user?.fullName ?? "U").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        logout()
                        navigate(ROUTES.HOME)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : isLoaded ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SIGN_IN)}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => navigate(ROUTES.SIGN_UP)}>
                  Get Started
                </Button>
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
