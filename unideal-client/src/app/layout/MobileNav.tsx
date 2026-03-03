import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerificationBadge } from "@/components/ui/VerificationBadge"
import { ROUTES } from "@/lib/constants"
import {
  Home,
  Search,
  LayoutDashboard,
  Heart,
  Wallet,
  MessageCircle,
  Settings,
  ShieldCheck,
  Plus,
  LogOut,
} from "lucide-react"

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

const LINKS = [
  { href: ROUTES.HOME, label: "Home", icon: Home },
  { href: ROUTES.BROWSE, label: "Browse", icon: Search },
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.FAVORITES, label: "Favorites", icon: Heart },
  { href: ROUTES.WALLET, label: "Wallet", icon: Wallet },
  { href: ROUTES.CHAT, label: "Chat", icon: MessageCircle },
  { href: ROUTES.VERIFICATION, label: "Verification", icon: ShieldCheck },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings },
]

/** Slide-out mobile navigation drawer */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const { isSignedIn, user, logout } = useAuth()
  const navigate = useNavigate()

  const verificationStatus = user?.verificationStatus ?? "UNVERIFIED"

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="font-brand text-2xl text-primary">
            Unideal
          </SheetTitle>
        </SheetHeader>

        {isSignedIn && user && (
          <div className="flex items-center gap-3 px-6 pb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName} />
              <AvatarFallback>
                {(user.fullName ?? "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <VerificationBadge
              status={verificationStatus as "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"}
              size="sm"
              showLabel={false}
            />
          </div>
        )}

        <Separator />

        <nav className="flex flex-col gap-1 p-4">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <Separator />

        <div className="flex flex-col gap-2 p-4">
          {isSignedIn ? (
            <>
              <NavLink to={ROUTES.SELL} onClick={onClose}>
                <Button className="w-full gap-2">
                  <Plus size={16} />
                  List an Item
                </Button>
              </NavLink>
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => {
                  logout()
                  onClose()
                  navigate(ROUTES.HOME)
                }}
              >
                <LogOut size={16} />
                Sign Out
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={() => { navigate(ROUTES.SIGN_IN); onClose() }}>
              Sign In
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
