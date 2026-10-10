import { useEffect } from 'react';

const DEFAULT_TITLE = 'StickerHub — Encontre seu sticker';
const DEFAULT_DESC =
  'Catálogo de stickers com fundo transparente. Copie, baixe em PNG ou adicione às suas fotos — sem cadastro.';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Updates document title + description/OG tags for client-side navigation. */
export function useDocumentMeta(title?: string, description?: string, image?: string) {
  useEffect(() => {
    const t = title ? `${title} — StickerHub` : DEFAULT_TITLE;
    const d = description || DEFAULT_DESC;
    document.title = t;
    setMeta('name', 'description', d);
    setMeta('property', 'og:title', t);
    setMeta('property', 'og:description', d);
    if (image) setMeta('property', 'og:image', new URL(image, window.location.origin).toString());
  }, [title, description, image]);
}
