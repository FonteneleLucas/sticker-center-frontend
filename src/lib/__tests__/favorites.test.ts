import { describe, it, expect, beforeEach } from 'vitest';
import { favorites } from '../favorites';
import type { Sticker } from '../types';

const mockSticker: Sticker = {
  id: 'stk-1',
  name: 'Cachorro Feliz',
  slug: 'cachorro-feliz',
  description: 'Um cachorrinho fofo',
  image_url: '/stickers/cachorro.png',
  optimized_url: '/stickers/cachorro-opt.png',
  thumbnail_url: '/stickers/cachorro-thumb.png',
  mime_type: 'image/png',
  width: 1024,
  height: 1024,
  has_transparency: true,
  category: { id: 'c1', name: 'Animais', slug: 'animais' },
  tags: ['cachorro', 'pet', 'cão'],
  is_featured: true,
  license: 'CC0',
  attribution: 'StickerHub',
  download_count: 5,
  copy_count: 2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Favorites store (offline-first)', () => {
  beforeEach(() => {
    localStorage.clear();
    favorites._reset();
  });

  it('starts empty', () => {
    expect(favorites.list()).toEqual([]);
    expect(favorites.has(mockSticker.id)).toBe(false);
  });

  it('adds and toggles favorite', () => {
    const isNowFav = favorites.toggle(mockSticker);
    expect(isNowFav).toBe(true);
    expect(favorites.has(mockSticker.id)).toBe(true);
    expect(favorites.list()).toHaveLength(1);

    const toggledOff = favorites.toggle(mockSticker);
    expect(toggledOff).toBe(false);
    expect(favorites.has(mockSticker.id)).toBe(false);
    expect(favorites.list()).toHaveLength(0);
  });

  it('clears all favorites', () => {
    favorites.add(mockSticker);
    expect(favorites.list()).toHaveLength(1);
    favorites.clear();
    expect(favorites.list()).toHaveLength(0);
  });
});
