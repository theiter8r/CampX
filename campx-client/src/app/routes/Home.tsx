import { useMemo } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ItemCard } from "@/components/items/ItemCard"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { useItems } from "@/hooks/useItems"
import { ROUTES } from "@/lib/constants"
import {
  ShieldCheck,
  Wallet,
  MessageCircle,
  BookOpen,
  Laptop,
  Dumbbell,
  Shirt,
  Armchair,
  Package,
  ArrowRight,
} from "lucide-react"

const STATS = [
  { label: "Students", value: "10K+" },
  { label: "Listings", value: "5K+" },
  { label: "Transactions", value: "2K+" },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "ID Verified Sellers",
    desc: "Every seller is authenticated with a college ID — no anonymous strangers.",
  },
  {
    icon: Wallet,
    title: "Escrow Protection",
    desc: "Funds are held until you confirm receipt. Zero risk of getting scammed.",
  },
  {
    icon: MessageCircle,
    title: "In-App Chat",
    desc: "Negotiate, share location, and coordinate pickup — all in one place.",
  },
]

const CATEGORIES = [
  { icon: BookOpen, label: "Textbooks" },
  { icon: Laptop, label: "Electronics" },
  { icon: Armchair, label: "Furniture" },
  { icon: Dumbbell, label: "Sports" },
  { icon: Shirt, label: "Clothing" },
  { icon: Package, label: "Miscellaneous" },
]

const HOW_IT_WORKS = [
  { step: 1, title: "Sign Up", desc: "Create your account with Google or email" },
  { step: 2, title: "Verify", desc: "Upload your college ID for seller access" },
  { step: 3, title: "List or Buy", desc: "Post items or browse your campus feed" },
  { step: 4, title: "Escrow Pays", desc: "Funds held safely until delivery confirmed" },
]

/** Landing / Home page */
export function Home() {
  const { data: itemsData, isLoading: itemsLoading } = useItems({ sort: "newest" })
  const recentItems = useMemo(
    () => itemsData?.pages.flatMap((p) => p.items).slice(0, 4) ?? [],
    [itemsData]
  )

  return (
    <div className="flex flex-col">
      <section
        id="hero"
        className="relative overflow-hidden px-4 pb-20 pt-20 sm:pb-24 sm:pt-24"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-[14%] top-6 h-44 w-44 rounded-full bg-cyan-400/18 blur-3xl" />
          <div className="absolute right-[10%] top-24 h-36 w-36 rounded-full bg-amber-300/14 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-56 w-3/4 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200"
            >
              Hyper-local. Student-verified. Escrow-protected.
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="mt-5 font-brand text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Campus Deals,
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Zero Drama.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14 }}
              className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
            >
              Discover trusted student listings near your college, negotiate in
              chat, and pay safely with escrow built for campus transactions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.22 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link to={ROUTES.BROWSE}>
                <Button size="xl" className="w-full sm:w-auto">
                  Browse Listings
                </Button>
              </Link>
              <Link to={ROUTES.SELL}>
                <Button
                  variant="secondary"
                  size="xl"
                  className="w-full border border-border/70 sm:w-auto"
                >
                  Start Selling
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="grid grid-cols-3 gap-3 rounded-2xl border border-zinc-700/70 bg-[#101a2a]/75 p-4 backdrop-blur-sm"
          >
            {STATS.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-700/70 bg-[#0d1524]/70 px-3 py-4 text-center"
              >
                <p className="text-2xl font-semibold text-primary">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="recent-listings" className="px-4 py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-zinc-700/65 bg-[#101a2a]/70 p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Recently Listed
            </h2>
            <Link to={ROUTES.BROWSE}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground hover:text-primary"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {itemsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <ItemCardSkeleton key={i} />
                ))
              : recentItems.map((item) => <ItemCard key={item.id} item={item} />)}

            {!itemsLoading && recentItems.length === 0 && (
              <div className="col-span-full rounded-xl border border-zinc-700/70 bg-[#0d1524]/80 py-12 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No listings yet. Be the first to{" "}
                  <Link to={ROUTES.SELL} className="text-primary hover:underline">
                    sell something
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="categories" className="bg-card/30 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-xl font-semibold text-foreground sm:text-2xl">
            Pick a Category
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <motion.div
                key={label}
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <Link
                  to={`${ROUTES.BROWSE}?category=${label.toLowerCase()}`}
                  className="group flex h-full flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-glow-card"
                >
                  <span className="rounded-lg bg-primary/12 p-2 transition-colors duration-200 group-hover:bg-primary/18">
                    <Icon className="text-primary" size={24} />
                  </span>
                  <span className="text-center text-xs font-medium text-muted-foreground">
                    {label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="why-campx" className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-xl font-semibold text-foreground sm:text-2xl">
            Why CampX?
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-glow-card"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                  <Icon className="text-primary" size={20} />
                </div>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-card/30 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-xl font-semibold text-foreground sm:text-2xl">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-5 text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
                  {step}
                </div>
                <h4 className="mt-3 font-medium text-foreground">{title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl rounded-2xl border border-zinc-700/70 bg-[#101a2a]/75 p-8 sm:p-10"
        >
          <h2 className="font-brand text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Trade Smarter?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join thousands of students already using CampX for safe, fast, and
            reliable campus transactions.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={ROUTES.BROWSE}>
              <Button size="xl" className="w-full sm:w-auto">
                Explore Listings
              </Button>
            </Link>
            <Link to={ROUTES.SELL}>
              <Button
                variant="secondary"
                size="xl"
                className="w-full border border-border/70 sm:w-auto"
              >
                List an Item
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
