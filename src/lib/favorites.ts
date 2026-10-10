import { useSyncExternalStore } from 'react';
import type { Sticker } from './types';

/**
 * Local favorites store (localStorage). No login, no sync between devices.
 * A snapshot of the sticker is stored so the favorites page renders offline-first.
 */
export const FAVORITES_KEY = 'stickerhub:favorites:v1';

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: Sticker[] | null = null;

function read(): Sticker[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter((s) => s && typeof s.id === 'string') : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(list: Sticker[]) {
  cache = list;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    /* storage full or disabled (private mode) — keep in memory */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === FAVORITES_KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

export const favorites = {
  list: read,
  has: (id: string) => read().some((s) => s.id === id),
  add: (sticker: Sticker) => {
    if (!favorites.has(sticker.id)) write([sticker, ...read()]);
  },
  remove: (id: string) => write(read().filter((s) => s.id !== id)),
  /** Returns the new state (true = favorited). */
  toggle: (sticker: Sticker): boolean => {
    if (favorites.has(sticker.id)) {
      favorites.remove(sticker.id);
      return false;
    }
    favorites.add(sticker);
    return true;
  },
  clear: () => write([]),
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Test helper. */
  _reset: () => {
    cache = null;
  },
};

export function useFavorites(): Sticker[] {
  return useSyncExternalStore(favorites.subscribe, read, () => []);
}

export function useIsFavorite(id: string): boolean {
  const list = useFavorites();
  return list.some((s) => s.id === id);
}
