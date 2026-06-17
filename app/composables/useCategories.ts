import type { Category } from '~/types/article'

export function useCategories() {
  const client = useSupabaseClient()

  return useAsyncData<Category[]>('categories', async () => {
    const { data } = await client
      .from('categories')
      .select('*')
      .order('sort_order')

    return data ?? []
  })
}
