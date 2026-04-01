// ============================================
// Browse Page — search, filter, sort, infinite scroll grid
// ============================================

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Package,
  SlidersHorizontal,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ItemGrid } from "@/components/items/ItemGrid"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { FilterSidebar } from "@/components/items/FilterSidebar"
import { useItems } from "@/hooks/useItems"
import { useDebounce } from "@/hooks/useDebounce"
import { useUserProfile } from "@/hooks"
import { SORT_OPTIONS } from "@/lib/constants"
import type { ItemFilters } from "@/types"

const DEFAULT_FILTERS: ItemFilters = {
  sort: "newest",
}

/**
 * Browse page with left filter sidebar, search, sort, and infinite-scroll grid.
 * Mobile uses a sheet overlay for filters.
 */
export function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: profile } = useUserProfile()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Build filters from URL search params
  const [filters, setFilters] = useState<ItemFilters>(() => ({
    category: searchParams.get("category") ?? undefined,
    type: (searchParams.get("type") as ItemFilters["type"]) ?? undefined,
    condition:
      (searchParams.get("condition") as ItemFilters["condition"]) ??
      undefined,
    priceMin: searchParams.get("priceMin")
      ? Number(searchParams.get("priceMin"))
      : undefined,
    priceMax: searchParams.get("priceMax")
      ? Number(searchParams.get("priceMax"))
      : undefined,
    sort: (searchParams.get("sort") as ItemFilters["sort"]) ?? "newest",
    college: searchParams.get("college") ?? profile?.college?.slug ?? undefined,
  }))

  const [searchText, setSearchText] = useState(searchParams.get("search") ?? "")
  const debouncedSearch = useDebounce(searchText, 300)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Merge debounced search into filters
  const activeFilters = useMemo<ItemFilters>(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
    }),
    [filters, debouncedSearch]
  )

  // Sync filters to URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeFilters.category) params.set("category", activeFilters.category)
    if (activeFilters.type) params.set("type", activeFilters.type)
    if (activeFilters.condition) params.set("condition", activeFilters.condition)
    if (activeFilters.priceMin) {
      params.set("priceMin", String(activeFilters.priceMin))
    }
    if (activeFilters.priceMax) {
      params.set("priceMax", String(activeFilters.priceMax))
    }
    if (activeFilters.sort && activeFilters.sort !== "newest") {
      params.set("sort", activeFilters.sort)
    }
    if (activeFilters.search) params.set("search", activeFilters.search)
    if (activeFilters.college) params.set("college", activeFilters.college)
    setSearchParams(params, { replace: true })
  }, [activeFilters, setSearchParams])

  // Fetch items
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useItems(activeFilters)

  // Flatten all pages
  const allItems = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  )

  // Infinite scroll observer
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSearchText("")
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      sort: value as ItemFilters["sort"],
      cursor: undefined,
    }))
  }, [])

  // College scope label
  const collegeLabel = profile?.college?.name ?? activeFilters.college ?? null

  const activeFilterCount = useMemo(() => {
    const trackedFilters = [
      activeFilters.category,
      activeFilters.type,
      activeFilters.condition,
      activeFilters.priceMin,
      activeFilters.priceMax,
      activeFilters.search,
    ]

    return trackedFilters.filter(
      (value) => value !== undefined && value !== null && value !== ""
    ).length
  }, [activeFilters])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#101a2a]/80"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 right-10 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl" />
          </div>

          <div className="relative space-y-5 p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Campus Discovery
                </p>
                <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                  Browse Campus Listings
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Explore trusted deals from nearby students across textbooks,
                  gadgets, furniture, and more.
                </p>
                {collegeLabel && (
                  <p className="text-sm text-muted-foreground">
                    Showing items from{" "}
                    <span className="font-semibold text-primary">
                      {collegeLabel}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                <div className="rounded-xl border border-zinc-700/80 bg-[#0d1524]/80 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                    Results
                  </p>
                  <p className="text-xl font-semibold text-zinc-100">
                    {allItems.length}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-700/80 bg-[#0d1524]/80 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                    Active Filters
                  </p>
                  <p className="text-xl font-semibold text-zinc-100">
                    {activeFilterCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search listings, categories, or keywords..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="h-11 border-zinc-700 bg-[#0d1524]/80 pl-9"
                  />
                </div>

                <Select
                  value={filters.sort ?? "newest"}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger className="h-11 w-full border-zinc-700 bg-[#0d1524]/80">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 border-zinc-700 bg-[#0d1524]/80"
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[85vw] max-w-sm overflow-y-auto border-zinc-700 bg-[#101a2a] pt-10"
                  >
                    <FilterSidebar
                      filters={filters}
                      onChange={(f) => {
                        setFilters(f)
                        setMobileFilterOpen(false)
                      }}
                      onReset={() => {
                        handleResetFilters()
                        setMobileFilterOpen(false)
                      }}
                    />
                  </SheetContent>
                </Sheet>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    className="h-10 border border-zinc-700 bg-[#0d1524]/70 text-muted-foreground hover:bg-zinc-800/70 hover:text-foreground"
                    onClick={handleResetFilters}
                  >
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        <div className="flex gap-6">
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-zinc-700/75 bg-[#101a2a]/70 p-4">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1 rounded-2xl border border-zinc-700/70 bg-[#0f1a2a]/50 p-4 sm:p-6">
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ItemCardSkeleton key={i} />
                  ))}
                </motion.div>
              )}

              {isError && !isLoading && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/40 bg-destructive/5 py-20"
                >
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-sm text-destructive">
                    {(error as Error)?.message ?? "Failed to load items"}
                  </p>
                  <Button onClick={() => refetch()} variant="outline">
                    Try Again
                  </Button>
                </motion.div>
              )}

              {!isLoading && !isError && allItems.length === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-4 rounded-xl border border-zinc-700/70 bg-[#0d1524]/75 py-20"
                >
                  <Package className="h-16 w-16 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-foreground">
                    No items found
                  </h3>
                  <p className="max-w-xs text-center text-sm text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                  <Button variant="outline" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                </motion.div>
              )}

              {!isLoading && !isError && allItems.length > 0 && (
                <motion.div
                  key="items"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ItemGrid items={allItems} />

                  <div
                    ref={loadMoreRef}
                    className="flex justify-center border-t border-zinc-700/70 py-8"
                  >
                    {isFetchingNextPage && (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                    {hasNextPage && !isFetchingNextPage && (
                      <Button
                        variant="outline"
                        className="border-zinc-700 bg-[#0d1524]/80"
                        onClick={() => fetchNextPage()}
                      >
                        Load More
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
