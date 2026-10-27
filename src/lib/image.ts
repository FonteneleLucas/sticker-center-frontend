import { mediaUrl } from './api';

/** Small in-memory cache so copy → download of the same sticker doesn't refetch. */
const blobCache = new Map<string, Promise<Blob>>();

export async function fetchBlob(url: string): Promise<Blob> {
  const abs = mediaUrl(url);
  let p = blobCache.get(abs);
  if (!p) {
    p = fetch(abs, { mode: 'cors', credentials: 'omit' }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.blob();
    });
    blobCache.set(abs, p);
    p.catch(() => blobCache.delete(abs));
    if (blobCache.size > 40) blobCache.delete(blobCache.keys().next().value as string);
  }
  return p;
}

export function loadImage(src: string, crossOrigin = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin && !src.startsWith('blob:') && !src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
    img.src = src;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem.'))), type, quality);
  });
}

/** Ensures the blob is a PNG (re-encodes via canvas if needed, preserving alpha). */
export async function ensurePng(blob: Blob): Promise<Blob> {
  if (blob.type === 'image/png') return blob;
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url, false);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    return await canvasToBlob(canvas, 'image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Triggers a file download for a blob with a friendly filename. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give Safari time to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function stickerFilename(slug: string, variant: 'original' | 'optimized' = 'original') {
  const safe = slug.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'sticker';
  return `stickerhub-${safe}${variant === 'optimized' ? '-512' : ''}.png`;
}

/** Downloads a sticker PNG (transparency preserved — the file is never re-encoded onto a background). */
export async function downloadSticker(url: string, slug: string, variant: 'original' | 'optimized' = 'original') {
  const blob = await ensurePng(await fetchBlob(url));
  downloadBlob(blob, stickerFilename(slug, variant));
}

export function recolorImageElement(img: HTMLImageElement, color: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Falha ao recolorir imagem'));
    }, 'image/png');
  });
}

/**
 * Recolors a sticker image preserving transparent alpha channel.
 * Uses source-in composition to replace non-transparent pixels with the chosen color.
 */
export async function recolorStickerBlob(imageUrl: string, color: string): Promise<Blob> {
  const fullUrl = mediaUrl(imageUrl);
  let blob: Blob;
  try {
    const res = await fetch(fullUrl, { mode: 'cors', credentials: 'omit' });
    if (res.ok) {
      blob = await res.blob();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    const img = await loadImage(fullUrl, true);
    return recolorImageElement(img, color);
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImage(objectUrl, false);
    return await recolorImageElement(img, color);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

