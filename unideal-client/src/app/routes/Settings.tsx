// ============================================
// Settings — user settings with notification preferences
// ============================================

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  Mail,
  BellRing,
  Loader2,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks"
import { cn } from "@/lib/utils"

const SETTINGS_SECTIONS = [
  { icon: User, label: "Profile", desc: "Name, avatar, contact info" },
  { icon: Shield, label: "Privacy & Security", desc: "Password, linked accounts" },
  { icon: CreditCard, label: "Payment", desc: "Bank accounts for withdrawal" },
]

/** Readable labels for notification type keys */
const NOTIFICATION_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  NEW_MESSAGE: { label: "New messages", description: "When someone sends you a chat message" },
  PAYMENT_RECEIVED: { label: "Payment received", description: "When a buyer makes a payment" },
  PAYMENT_RELEASED: { label: "Payment released", description: "When escrow funds are released to you" },
  PAYMENT_REFUNDED: { label: "Payment refunded", description: "When a payment is refunded" },
  ORDER_UPDATE: { label: "Order updates", description: "Status changes on your transactions" },
  ITEM_SOLD: { label: "Item sold", description: "When someone purchases your listing" },
  VERIFICATION_APPROVED: { label: "Verification approved", description: "When your ID is verified" },
  VERIFICATION_REJECTED: { label: "Verification rejected", description: "When your ID is rejected" },
  REVIEW_RECEIVED: { label: "New review", description: "When someone reviews you" },
}

/** Settings page with notification preferences */
export function Settings() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="text-primary" size={24} />
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      </div>

      {/* Settings sections (placeholder links for Phase 6) */}
      <div className="space-y-2 mb-8">
        {SETTINGS_SECTIONS.map(({ icon: Icon, label, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <button className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/50 transition-all duration-150">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="text-primary" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      <Separator className="my-6" />

      {/* Notification Preferences (5F.6 — real implementation) */}
      <NotificationPreferencesSection />

      <Separator className="my-6" />
      <p className="text-center text-sm text-muted-foreground">
        Additional settings coming in Phase 6.
      </p>
    </div>
  )
}

// ── Notification Preferences Section ─────────────────────────────────────────

function NotificationPreferencesSection() {
  const { data: prefs, isLoading, isError } = useNotificationPreferences()
  const updatePrefs = useUpdateNotificationPreferences()

  // Derive the list of notification types from current prefs
  const notifTypes = useMemo(() => {
    if (!prefs) return []
    // Get all unique keys from both email and inApp
    const keys = new Set([
      ...Object.keys(prefs.email ?? {}),
      ...Object.keys(prefs.inApp ?? {}),
    ])
    return Array.from(keys).sort()
  }, [prefs])

  const handleToggle = (
    channel: "email" | "inApp",
    type: string,
    checked: boolean
  ) => {
    updatePrefs.mutate({
      [channel]: { [type]: checked },
    })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Bell className="text-primary" size={20} />
        <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
        {updatePrefs.isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Failed to load notification preferences. Please try again.
        </p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-4 py-2.5 bg-muted/30 border-b border-border">
            <div className="flex-1" />
            <div className="flex items-center gap-1 w-14 justify-center">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase">Email</span>
            </div>
            <div className="flex items-center gap-1 w-14 justify-center">
              <BellRing className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase">In-App</span>
            </div>
          </div>

          {/* Rows */}
          {notifTypes.map((type, i) => {
            const meta = NOTIFICATION_TYPE_LABELS[type] ?? {
              label: type.replace(/_/g, " ").toLowerCase(),
              description: "",
            }
            const emailOn = prefs?.email?.[type] ?? false
            const inAppOn = prefs?.inApp?.[type] ?? true

            return (
              <div
                key={type}
                className={cn(
                  "flex items-center gap-4 px-4 py-3",
                  i < notifTypes.length - 1 && "border-b border-border"
                )}
              >
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium text-foreground block">
                    {meta.label}
                  </Label>
                  {meta.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {meta.description}
                    </p>
                  )}
                </div>

                <div className="w-14 flex justify-center">
                  <Switch
                    checked={emailOn}
                    onCheckedChange={(checked) => handleToggle("email", type, checked)}
                    aria-label={`${meta.label} email notifications`}
                  />
                </div>

                <div className="w-14 flex justify-center">
                  <Switch
                    checked={inAppOn}
                    onCheckedChange={(checked) => handleToggle("inApp", type, checked)}
                    aria-label={`${meta.label} in-app notifications`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.section>
  )
}
