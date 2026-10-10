import { copyText } from './clipboard';
import { ensurePng, fetchBlob, stickerFilename } from './image';
import type { Sticker } from './types';

export function stickerPageUrl(slug: string): string {
  return `${window.location.origin}/sticker/${encodeURIComponent(slug)}`;
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Shares the LINK to a sticker page (Web Share API) or copies the link as a fallback. */
export async function shareStickerLink(sticker: Sticker): Promise<ShareOutcome> {
  const url = stickerPageUrl(sticker.slug);
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: `${sticker.name} — StickerHub`, text: `Sticker “${sticker.name}”`, url });
      return 'shared';
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return 'cancelled';
      // fall through to copy link
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed';
}

/** Whether the browser can share image FILES (not just links). */
export function canShareFiles(): boolean {
  if (typeof navigator.canShare !== 'function' || typeof File === 'undefined') return false;
  try {
    const probe = new File([new Uint8Array([0])], 'probe.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Shares the PNG file itself. Returns 'failed' when unsupported so callers can offer the download. */
export async function shareStickerFile(sticker: Sticker): Promise<ShareOutcome> {
  if (!canShareFiles()) return 'failed';
  try {
    const blob = await ensurePng(await fetchBlob(sticker.image_url));
    const file = new File([blob], stickerFilename(sticker.slug), { type: 'image/png' });
    if (!navigator.canShare({ files: [file] })) return 'failed';
    await navigator.share({ files: [file], title: sticker.name });
    return 'shared';
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return 'cancelled';
    return 'failed';
  }
}
