import { useCallback, useState } from 'react';
import { useToast } from '../components/Toast';
import { copyImageFromUrl } from './clipboard';
import { favorites } from './favorites';
import { downloadSticker } from './image';
import { trackEvent } from './metrics';
import { shareStickerFile, shareStickerLink } from './share';
import type { Sticker } from './types';

/** Shared copy / download / favorite / share actions with user feedback. */
export function useStickerActions() {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const copy = useCallback(
    async (s: Sticker) => {
      setBusy(`copy:${s.id}`);
      // Called synchronously from the click handler: copyImageFromUrl builds the ClipboardItem immediately.
      const result = await copyImageFromUrl(s.image_url);
      setBusy(null);
      if (result.ok) {
        trackEvent(s.id, 'copy');
        toast.success('Sticker copiado! Cole em um app compatível.');
      } else {
        toast.error(result.message);
      }
      return result.ok;
    },
    [toast],
  );

  const download = useCallback(
    async (s: Sticker, variant: 'original' | 'optimized' = 'original') => {
      setBusy(`download:${s.id}`);
      try {
        await downloadSticker(variant === 'original' ? s.image_url : s.optimized_url, s.slug, variant);
        trackEvent(s.id, 'download');
        toast.success('Download iniciado (PNG transparente).');
        return true;
      } catch {
        toast.error('Não foi possível baixar o sticker. Tente novamente.');
        return false;
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );

  const toggleFavorite = useCallback(
    (s: Sticker) => {
      const added = favorites.toggle(s);
      toast.info(added ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.');
    },
    [toast],
  );

  const shareLink = useCallback(
    async (s: Sticker) => {
      const outcome = await shareStickerLink(s);
      if (outcome === 'copied') toast.success('Link do sticker copiado.');
      else if (outcome === 'failed') toast.error('Não foi possível compartilhar o link.');
    },
    [toast],
  );

  const shareFile = useCallback(
    async (s: Sticker) => {
      const outcome = await shareStickerFile(s);
      if (outcome === 'failed') {
        toast.info('Seu navegador não compartilha arquivos. Baixando o PNG…');
        await download(s);
      }
    },
    [toast, download],
  );

  return { copy, download, toggleFavorite, shareLink, shareFile, busy };
}
