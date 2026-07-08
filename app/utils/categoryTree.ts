import type { Category } from '~/types/article'

export interface CategoryNode extends Category {
  children: Category[]
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  return categories
    .filter(c => c.parent_id == null)
    .map(parent => ({
      ...parent,
      children: categories
        .filter(c => c.parent_id === parent.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
}

// A category can hold articles directly iff it has no children.
export function getAssignableCategories(categories: Category[]): Category[] {
  const parentIds = new Set(categories.map(c => c.parent_id).filter((id): id is number => id != null))
  return categories.filter(c => !parentIds.has(c.id))
}
