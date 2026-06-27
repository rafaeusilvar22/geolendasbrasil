export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  gradient: [string, string]
  sort_order: number
  show_in_nav: boolean
  show_in_home: boolean
  created_at: string
}

export interface Article {
  id: number
  title: string
  excerpt: string
  content: string | null
  state: string
  category_id: number | null
  category?: Category
  type: string
  gradient?: [string, string]
  slug: string
  published: boolean
  audio_url: string | null
  has_audio: boolean
  created_at: string
  updated_at: string
}

export interface StateItem {
  id: string
  name: string
}

export interface CategoryGroup {
  category: Category
  articles: Article[]
}
