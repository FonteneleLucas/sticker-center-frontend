import { memo } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../lib/api';
import { useIsFavorite } from '../lib/favorites';
import type { Sticker } from '../lib/types';
import { useStickerActions } from '../lib/useStickerActions';
import { IconCopy, IconDownload, IconHeart } from './Icons';

export const StickerCard = memo(function StickerCard({ sticker }: { sticker: Sticker }) {
  const { copy, download, toggleFavorite, busy } = useStickerActions();
  const fav = useIsFavorite(sticker.id);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        to={`/sticker/${sticker.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-offset-[-3px]"
        aria-label={`Ver detalhes de ${sticker.name}`}
      >
        <div className="checkerboard relative aspect-square w-full">
          <img
            src={mediaUrl(sticker.thumbnail_url)}
            alt={sticker.description ? `${sticker.name}: ${sticker.description}` : sticker.name}
            loading="lazy"
            decoding="async"
            width={256}
            height={256}
            className="absolute inset-0 h-full w-full object-contain p-3 transition duration-200 group-hover:scale-105"
          />
        </div>
        <h3 className="truncate px-3 pt-2 text-sm font-semibold text-slate-800">{sticker.name}</h3>
      </Link>

      <button
        type="button"
        onClick={() => toggleFavorite(sticker)}
        className={`icon-btn absolute right-1.5 top-1.5 h-10 w-10 bg-white/90 shadow-sm backdrop-blur ${
          fav ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
        }`}
        aria-pressed={fav}
        aria-label={fav ? `Remover ${sticker.name} dos favoritos` : `Favoritar ${sticker.name}`}
      >
        <IconHeart filled={fav} size={18} />
      </button>

      <div className="flex gap-1.5 p-2">
        <button
          type="button"
          onClick={() => copy(sticker)}
          disabled={busy === `copy:${sticker.id}`}
          className="btn-secondary min-h-[40px] flex-1 px-2 text-xs"
          aria-label={`Copiar ${sticker.name}`}
        >
          <IconCopy size={16} /> <span className="hidden min-[380px]:inline">Copiar</span>
        </button>
        <button
          type="button"
          onClick={() => download(sticker)}
          disabled={busy === `download:${sticker.id}`}
          className="btn-primary min-h-[40px] flex-1 px-2 text-xs"
          aria-label={`Baixar ${sticker.name} em PNG`}
        >
          <IconDownload size={16} /> <span className="hidden min-[380px]:inline">Baixar</span>
        </button>
      </div>
    </article>
  );
});
