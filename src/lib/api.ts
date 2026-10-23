import type { AdminStats, Category, ListParams, Page, Sticker } from './types';

/** Base URL for the API. Empty string = same origin (dev proxy / production). */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const TOKEN_KEY = 'stickerhub:admin-token';

export const adminToken = {
  get: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

function qs(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : '';
}

async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.auth) {
    const token = adminToken.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
  }
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.detail === 'string') message = data.detail;
      else if (Array.isArray(data?.detail)) message = data.detail.map((d: { msg?: string }) => d.msg).join('; ');
    } catch {
      /* ignore non-JSON bodies */
    }
    if (res.status === 401 && init.auth) adminToken.clear();
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Resolve a media URL returned by the API (may be root-relative) to an absolute URL. */
export function mediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url}`;
}

export const api = {
  listStickers: (p: ListParams = {}) => request<Page<Sticker>>(`/stickers${qs(p)}`),
  search: (p: ListParams) => request<Page<Sticker>>(`/search${qs(p)}`),
  featured: (limit = 12) => request<Sticker[]>(`/stickers/featured${qs({ limit })}`),
  getSticker: (idOrSlug: string) => request<Sticker>(`/stickers/${encodeURIComponent(idOrSlug)}`),
  related: (idOrSlug: string, limit = 12) =>
    request<Sticker[]>(`/stickers/${encodeURIComponent(idOrSlug)}/related${qs({ limit })}`),
  categories: () => request<Category[]>('/categories'),
  getCategory: (slug: string) => request<Category>(`/categories/${encodeURIComponent(slug)}`),
  categoryStickers: (slug: string, p: ListParams = {}) =>
    request<Page<Sticker>>(`/categories/${encodeURIComponent(slug)}/stickers${qs(p)}`),
  sendEvents: (events: { sticker_id: string; type: 'copy' | 'download'; count: number }[]) =>
    request<void>('/events/batch', { method: 'POST', body: JSON.stringify({ events }), keepalive: true }),

  admin: {
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string; expires_in: number }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ id: string; email: string }>('/admin/me', { auth: true }),
    stats: () => request<AdminStats>('/admin/stats', { auth: true }),
    listStickers: (p: ListParams & { status?: 'all' | 'active' | 'inactive' }) =>
      request<Page<Sticker>>(`/admin/stickers${qs(p)}`, { auth: true }),
    getSticker: (id: string) => request<Sticker>(`/admin/stickers/${id}`, { auth: true }),
    createSticker: (form: FormData) =>
      request<Sticker>('/admin/stickers', { method: 'POST', body: form, auth: true }),
    updateSticker: (id: string, patch: Partial<Omit<Sticker, 'category'>> & { category_id?: string }) =>
      request<Sticker>(`/admin/stickers/${id}`, { method: 'PATCH', body: JSON.stringify(patch), auth: true }),
    replaceImage: (id: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<Sticker>(`/admin/stickers/${id}/image`, { method: 'PUT', body: form, auth: true });
    },
    deleteSticker: (id: string, hard = false) =>
      request<void>(`/admin/stickers/${id}${hard ? '?hard=true' : ''}`, { method: 'DELETE', auth: true }),
    listCategories: () => request<Category[]>('/admin/categories', { auth: true }),
    createCategory: (data: Partial<Category>) =>
      request<Category>('/admin/categories', { method: 'POST', body: JSON.stringify(data), auth: true }),
    uploadCategoryCover: (id: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<Category>(`/admin/categories/${id}/cover`, { method: 'POST', body: form, auth: true });
    },
    updateCategory: (id: string, data: Partial<Category>) =>
      request<Category>(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data), auth: true }),
    deleteCategory: (id: string) =>
      request<void>(`/admin/categories/${id}`, { method: 'DELETE', auth: true }),
    reorderCategories: (ids: string[]) =>
      request<void>('/admin/categories/reorder', { method: 'POST', body: JSON.stringify({ ids }), auth: true }),
  },
};
