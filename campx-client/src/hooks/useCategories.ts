import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface Category {
  id: number
  name: string
  slug: string
  iconName: string
}

/** Fetches all categories from the API */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/api/categories"),
    staleTime: Infinity,
  })
}
