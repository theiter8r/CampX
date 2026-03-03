// ============================================
// Hook: useNotifications — notification list, mark-read, preferences
// ============================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/lib/api"
import type { Notification, NotificationPreferences } from "@/types"

// ── Notification List ─────────────────────────────────────────────────────────

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
  nextCursor: string | null
  hasMore: boolean
}

interface UseNotificationsOptions {
  unreadOnly?: boolean
}

/** Fetches paginated notifications */
export function useNotifications(opts: UseNotificationsOptions = {}) {
  const { isSignedIn } = useAuth()

  return useInfiniteQuery<NotificationsResponse>({
    queryKey: ["notifications", { unreadOnly: opts.unreadOnly }],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number | boolean> = { limit: 20 }
      if (pageParam) params.cursor = pageParam as string
      if (opts.unreadOnly) params.unreadOnly = true
      const res = await api.get<{ success: boolean; data: NotificationsResponse }>(
        "/api/notifications",
        { params }
      )
      return res.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!isSignedIn,
  })
}

// ── Unread Count ──────────────────────────────────────────────────────────────

/** Returns the unread notification count from the first page of notifications */
export function useUnreadCount() {
  const { isSignedIn } = useAuth()

  return useQuery<number>({
    queryKey: ["notifications", "unreadCount"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: NotificationsResponse }>(
        "/api/notifications",
        { params: { limit: 1 } }
      )
      return res.data.unreadCount
    },
    enabled: !!isSignedIn,
    refetchInterval: 30_000,
  })
}

// ── Mark as Read ──────────────────────────────────────────────────────────────

interface MarkReadInput {
  ids?: string[]
  all?: boolean
}

/** Marks specific notifications or all as read */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation<{ markedRead: number }, Error, MarkReadInput>({
    mutationFn: async (input) => {
      const body = input.all ? { all: true } : { ids: input.ids }
      const res = await api.patch<{ success: boolean; data: { markedRead: number } }>(
        "/api/notifications/read",
        body
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["userProfile"] })
    },
  })
}

// ── Delete Notification ───────────────────────────────────────────────────────

/** Deletes a single notification */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete<{ success: boolean }>(`/api/notifications/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

// ── Notification Preferences ──────────────────────────────────────────────────

/** Fetches notification preferences (email + inApp toggles per type) */
export function useNotificationPreferences() {
  const { isSignedIn } = useAuth()

  return useQuery<NotificationPreferences>({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: NotificationPreferences }>(
        "/api/users/me/notification-preferences"
      )
      return res.data
    },
    enabled: !!isSignedIn,
  })
}

/** Updates notification preferences (partial update — deep merged on backend) */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation<NotificationPreferences, Error, Partial<NotificationPreferences>>({
    mutationFn: async (input) => {
      const res = await api.put<{ success: boolean; data: NotificationPreferences }>(
        "/api/users/me/notification-preferences",
        input
      )
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["notificationPreferences"], data)
    },
  })
}
