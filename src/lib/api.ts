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

const USER_TOKEN_KEY = 'stickerhub:user-token';

export const userToken = {
  get: (): string | null => {
    try {
      return localStorage.getItem(USER_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => localStorage.setItem(USER_TOKEN_KEY, token),
  clear: () => localStorage.removeItem(USER_TOKEN_KEY),
};

export interface UserSubscription {
  id: string;
  plan: 'monthly' | 'annual';
  status: string;
  provider: string;
  amount_cents: number;
  base_amount_cents: number;
  coupon_code: string | null;
  next_payment_date: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  is_premium: boolean;
  premium_until: string | null;
  subscription: UserSubscription | null;
}

export interface PlansInfo {
  plans: { id: 'monthly' | 'annual'; label: string; price_cents: number; months: number }[];
  annual_savings_percent: number;
  payments_enabled: boolean;
  stripe_enabled?: boolean;
  mercadopago_enabled?: boolean;
}

export interface Quote {
  plan: string;
  base_cents: number;
  final_cents: number;
  discount_cents: number;
  coupon_code: string | null;
  coupon_description: string | null;
}

export interface PixCheckoutData {
  subscription_id: string;
  payment_id: string;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string | null;
  expires_at: string | null;
  amount_cents: number;
  plan: string;
  free: boolean;
  user: AuthUser;
}

export interface PixStatusData {
  payment_id: string;
  approved: boolean;
  status: string;
  user: AuthUser;
}

export interface BillingSettings {
  monthly_price: number;
  annual_price: number;
  payments_enabled: boolean;
  webhook_secret_configured: boolean;
  google_client_id?: string | null;
  stripe_configured?: boolean;
  mercadopago_configured?: boolean;
  default_card_gateway?: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  is_premium: boolean;
  premium_override: boolean | null;
  premium_until: string | null;
  plan: string | null;
  subscription_status: string | null;
  created_at: string;
}

export interface AdminUserPage {
  items: AdminUserRow[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
  premium_total: number;
}

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  plan: string | null;
  user_email: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

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
  } else {
    const ut = userToken.get();
    if (ut) headers.set('Authorization', `Bearer ${ut}`);
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
  auth: {
    register: (email: string, password: string, name?: string) =>
      request<{ access_token: string; user: AuthUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name: name || null }),
      }),
    login: (email: string, password: string) =>
      request<{ access_token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    googleLogin: (credential: string) =>
      request<{ access_token: string; user: AuthUser }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      }),
    googleClientId: () => request<{ client_id: string | null }>('/auth/google/client-id'),
    me: () => request<AuthUser>('/auth/me'),
  },
  billing: {
    plans: () => request<PlansInfo>('/billing/plans'),
    validateCoupon: (plan: string, code: string) =>
      request<Quote>('/billing/coupon/validate', { method: 'POST', body: JSON.stringify({ plan, code }) }),
    checkout: (plan: string, coupon_code?: string, device_id?: string, gateway?: 'stripe' | 'mercadopago') =>
      request<{ subscription_id: string; status: string; init_point: string | null; free: boolean; user: AuthUser }>(
        '/billing/checkout',
        { method: 'POST', body: JSON.stringify({ plan, coupon_code: coupon_code || null, device_id: device_id || null, gateway: gateway || null }) },
      ),
    checkoutPix: (plan: string, coupon_code?: string, device_id?: string) =>
      request<PixCheckoutData>('/billing/checkout-pix', {
        method: 'POST',
        body: JSON.stringify({ plan, coupon_code: coupon_code || null, device_id: device_id || null }),
      }),
    pixStatus: (payment_id: string) =>
      request<PixStatusData>(`/billing/pix-status/${encodeURIComponent(payment_id)}`),
    sync: (param?: string | { preapproval_id?: string; session_id?: string }) => {
      let query = '';
      if (typeof param === 'string') {
        if (param.startsWith('cs_')) {
          query = `?session_id=${encodeURIComponent(param)}`;
        } else {
          query = `?preapproval_id=${encodeURIComponent(param)}`;
        }
      } else if (param) {
        const q = new URLSearchParams();
        if (param.preapproval_id) q.set('preapproval_id', param.preapproval_id);
        if (param.session_id) q.set('session_id', param.session_id);
        const s = q.toString();
        if (s) query = `?${s}`;
      }
      return request<AuthUser>(`/billing/sync${query}`, { method: 'POST' });
    },
    portal: () => request<{ url: string }>('/billing/stripe/portal', { method: 'POST' }),
    cancel: () => request<AuthUser>('/billing/cancel', { method: 'POST' }),
  },
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
    billingSettings: () => request<BillingSettings>('/admin/billing/settings', { auth: true }),
    saveBillingSettings: (monthly_price: number, annual_price: number, google_client_id?: string | null) =>
      request<BillingSettings>('/admin/billing/settings', {
        method: 'PUT',
        body: JSON.stringify({ monthly_price, annual_price, google_client_id }),
        auth: true,
      }),
    users: (p: { q?: string; premium?: boolean; page?: number }) =>
      request<AdminUserPage>(`/admin/users${qs(p)}`, { auth: true }),
    setPremium: (id: string, active: boolean | null) =>
      request<AdminUserRow>(`/admin/users/${id}/premium`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
        auth: true,
      }),
    coupons: () => request<AdminCoupon[]>('/admin/coupons', { auth: true }),
    createCoupon: (data: Record<string, unknown>) =>
      request<AdminCoupon>('/admin/coupons', { method: 'POST', body: JSON.stringify(data), auth: true }),
    updateCoupon: (id: string, data: Record<string, unknown>) =>
      request<AdminCoupon>(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data), auth: true }),
    deleteCoupon: (id: string) => request<void>(`/admin/coupons/${id}`, { method: 'DELETE', auth: true }),
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
    importStickersCsv: (file: File, baseDir?: string) => {
      const form = new FormData();
      form.append('file', file);
      if (baseDir && baseDir.trim()) form.append('base_dir', baseDir.trim());
      return request<{
        total: number;
        success_count: number;
        error_count: number;
        errors: string[];
      }>('/admin/stickers/import-csv', { method: 'POST', body: form, auth: true });
    },
  },
};
