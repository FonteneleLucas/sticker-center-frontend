export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  parent_id: string | null;
  sort_order: number;
  sticker_count: number;
}

export interface Category extends CategoryRef {
  description: string | null;
  thumbnail_url: string | null;
  parent_id?: string | null;
  sort_order: number;
  sticker_count: number;
  folders?: Folder[];
  is_active?: boolean;
  created_at?: string;
}

export interface Sticker {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
  optimized_url: string;
  thumbnail_url: string;
  mime_type: string;
  width: number;
  height: number;
  has_transparency: boolean;
  category: CategoryRef | null;
  tags: string[];
  is_featured: boolean;
  is_premium?: boolean;
  license: string | null;
  attribution: string | null;
  download_count: number;
  copy_count: number;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
}

export interface Page<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export type SortOption = 'popular' | 'newest' | 'name' | 'relevance';

export interface ListParams {
  page?: number;
  page_size?: number;
  category?: string;
  folder?: string;
  sort?: SortOption;
  q?: string;
}

export interface AdminStats {
  stickers_total: number;
  stickers_active: number;
  categories_total: number;
  downloads_total: number;
  copies_total: number;
  top_stickers: Sticker[];
}
