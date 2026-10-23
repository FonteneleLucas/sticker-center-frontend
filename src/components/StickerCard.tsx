import { memo } from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../lib/api';
import { useIsFavorite } from '../lib/favorites';
import type { Sticker } from '../lib/types';
import { useStickerActions } from '../lib/useStickerActions';
import { IconCopy, IconDownload, IconHeart } from './Icons';

/**
 * Curated story card background tones from the reference image:
 * - Warm champagne nude (#E5CEB8)
 * - Warm taupe / latte (#C2A385)
 * - Deep obsidian charcoal (#1C1917)
 * - Rich warm mocha (#4A3A2E)
 */
const CARD_TONES = [
  'bg-[#E5CEB8] text-[#1A1614]',
  'bg-[#C2A385] text-[#1A1614]',
  'bg-[#1C1917] text-[#F5EDE4]',
  'bg-[#4A3A2E] text-[#F5EDE4]',
];

function getCardToneClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CARD_TONES[hash % CARD_TONES.length];
}

export const StickerCard = memo(function StickerCard({ sticker }: { sticker: Sticker }) {
  const { copy, download, toggleFavorite, busy } = useStickerActions();
  const fav = useIsFavorite(sticker.id);
  const toneClass = getCardToneClass(sticker.id || sticker.slug);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#DFB992]/20 bg-[#141210] shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-[#DFB992]/45 hover:shadow-glow">
      {/* Vertical Story-proportioned preview card matching the reference screens */}
      <div className={`relative aspect-[3/4] w-full overflow-hidden ${toneClass}`}>
        <Link
          to={`/sticker/${sticker.slug}`}
          className="flex h-full w-full items-center justify-center p-3 sm:p-4 focus-visible:outline-offset-[-3px]"
          aria-label={`Ver detalhes de ${sticker.name}`}
        >
          <img
            src={mediaUrl(sticker.thumbnail_url)}
            alt={sticker.description ? `${sticker.name}: ${sticker.description}` : sticker.name}
            loading="lazy"
            decoding="async"
            width={256}
            height={256}
            className="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.28)] transition duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Quick copy & download pill in top-left (visible on hover or focus, plus accessible) */}
        <div className="absolute left-2 top-2 flex items-center gap-1 opacity-90 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              copy(sticker);
            }}
            disabled={busy === `copy:${sticker.id}`}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#DFB992]/30 bg-[#12100E]/85 text-[#F2DEC9] backdrop-blur-sm transition hover:border-[#DFB992] hover:bg-[#DFB992] hover:text-[#120F0D]"
            title={`Copiar ${sticker.name}`}
            aria-label={`Copiar ${sticker.name}`}
          >
            <IconCopy size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              download(sticker);
            }}
            disabled={busy === `download:${sticker.id}`}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#DFB992]/30 bg-[#12100E]/85 text-[#F2DEC9] backdrop-blur-sm transition hover:border-[#DFB992] hover:bg-[#DFB992] hover:text-[#120F0D]"
            title={`Baixar ${sticker.name}`}
            aria-label={`Baixar ${sticker.name} em PNG`}
          >
            <IconDownload size={13} />
          </button>
        </div>

        {/* Signature circular dark badge in bottom-right corner with champagne-gold heart */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(sticker);
          }}
          className={`absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition duration-200 ${
            fav
              ? 'border-[#DFB992] bg-[#DFB992] text-[#120F0D] shadow-glow'
              : 'border-[#DFB992]/35 bg-[#12100E]/85 text-[#DFB992] hover:border-[#DFB992] hover:bg-[#12100E]'
          }`}
          aria-pressed={fav}
          aria-label={fav ? `Remover ${sticker.name} dos favoritos` : `Favoritar ${sticker.name}`}
        >
          <IconHeart filled={fav} size={15} />
        </button>
      </div>

      {/* Compact bottom action bar for 1-tap Copy / Download */}
      <div className="flex items-center justify-between gap-1 border-t border-[#DFB992]/15 bg-[#12100E] px-2 py-1.5">
        <button
          type="button"
          onClick={() => copy(sticker)}
          disabled={busy === `copy:${sticker.id}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-semibold text-[#E6D5C3] transition hover:bg-[#DFB992]/15 hover:text-[#DFB992] disabled:opacity-50"
          aria-label={`Copiar ${sticker.name}`}
        >
          <IconCopy size={13} />
          <span>Copiar</span>
        </button>
        <span className="h-3 w-px bg-[#DFB992]/15" aria-hidden />
        <button
          type="button"
          onClick={() => download(sticker)}
          disabled={busy === `download:${sticker.id}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-semibold text-[#DFB992] transition hover:bg-[#DFB992]/15 disabled:opacity-50"
          aria-label={`Baixar ${sticker.name}`}
        >
          <IconDownload size={13} />
          <span>Baixar</span>
        </button>
      </div>
    </article>
  );
});
