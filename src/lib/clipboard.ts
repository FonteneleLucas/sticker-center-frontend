import { ensurePng, fetchBlob } from './image';
import { mediaUrl } from './api';

export type CopyResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'denied' | 'failed'; message: string };

const DOWNLOAD_HINT = 'Use “Baixar PNG” e insira a imagem pelo seu app.';

/** Whether this browser exposes the async Clipboard API for images. */
export function canCopyImages(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  // If navigator.clipboard.write exists, allow attempt
  if (navigator.clipboard && typeof navigator.clipboard.write === 'function') {
    return true;
  }
  return false;
}


function classify(err: unknown): CopyResult {
  const name = (err as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      ok: false,
      reason: 'denied',
      message: `O navegador bloqueou o acesso à área de transferência. ${DOWNLOAD_HINT}`,
    };
  }
  if (name === 'NotSupportedError' || name === 'DataError') {
    return { ok: false, reason: 'unsupported', message: `Este navegador não copia imagens. ${DOWNLOAD_HINT}` };
  }
  return { ok: false, reason: 'failed', message: `Não foi possível copiar o sticker. ${DOWNLOAD_HINT}` };
}

async function getPngBlob(url: string): Promise<Blob> {
  const fullUrl = mediaUrl(url);

  try {
    // 1. First attempt: fetch directly as ArrayBuffer and build a clean image/png Blob
    const res = await fetch(fullUrl, { mode: 'cors', credentials: 'omit' });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return new Blob([buffer], { type: 'image/png' });
    }
  } catch {
    /* fallback to Image/Canvas */
  }

  // 2. Second attempt: load into image and export via canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D indisponível'));
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao converter imagem'));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Falha ao carregar a imagem'));
    img.src = fullUrl;
  });
}


/**
 * Copies a PNG image to the clipboard.
 * Safari STRICTLY requires creating `new ClipboardItem({'image/png': <Promise<Blob>>})`
 * synchronously within the user gesture callback before any await.
 */
export async function copyImageFromUrl(url: string): Promise<CopyResult> {
  if (typeof window === 'undefined' || !navigator.clipboard || typeof navigator.clipboard.write !== 'function') {
    return {
      ok: false,
      reason: 'unsupported',
      message: `Seu navegador não suporta cópia direta de imagens. ${DOWNLOAD_HINT}`,
    };
  }

  // Promise started immediately so Safari recognizes user gesture activation
  const blobPromise = getPngBlob(url);

  try {
    if (typeof ClipboardItem !== 'undefined') {
      // 1. Try promise pattern (Required for Safari/WebKit iOS & macOS)
      try {
        const item = new ClipboardItem({ 'image/png': blobPromise });
        await navigator.clipboard.write([item]);
        return { ok: true };
      } catch (safariErr: any) {
        // 2. If promise pattern failed (e.g. Chrome on older Android), await blob and write directly
        const resolvedBlob = await blobPromise;
        const item = new ClipboardItem({ 'image/png': resolvedBlob });
        await navigator.clipboard.write([item]);
        return { ok: true };
      }
    } else {
      return {
        ok: false,
        reason: 'unsupported',
        message: `ClipboardItem indisponível no navegador. ${DOWNLOAD_HINT}`,
      };
    }
  } catch (err: any) {
    return classify(err);
  }
}



/** Copies plain text (used for "copiar link"), with a legacy fallback. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
