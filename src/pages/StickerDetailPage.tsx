import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { ErrorState, Spinner } from '../components/States';
import { api, mediaUrl } from '../lib/api';
import { useIsFavorite } from '../lib/favorites';
import { useDocumentMeta } from '../lib/seo';
import { useStickerActions } from '../lib/useStickerActions';
import type { Sticker } from '../lib/types';
import {
  IconCopy,
  IconDownload,
  IconHeart,
  IconShare,
  IconLink,
  IconChevronLeft,
  IconLock,
} from '../components/Icons';
import { WatermarkOverlay } from '../components/WatermarkOverlay';

const BG_SWATCHES = [
  { label: 'Champagne', className: 'bg-[#E5CEB8]' },
  { label: 'Taupe', className: 'bg-[#C2A385]' },
  { label: 'Obsidian', className: 'bg-[#181512]' },
  { label: 'Mocha', className: 'bg-[#4A3A2E]' },
  { label: 'Transparente', className: 'checkerboard' },
];

export function StickerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [related, setRelated] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewBg, setPreviewBg] = useState<string>(BG_SWATCHES[0].className);

  const { copy, download, toggleFavorite, shareLink, shareFile, busy } = useStickerActions();
  const isFav = useIsFavorite(sticker?.id || '');

  useDocumentMeta(
    sticker ? `${sticker.name}` : 'Figurinha',
    sticker?.description || 'Figurinha transparente para download ou aplicação nos stories.',
    sticker?.image_url
  );

  useEffect(() => {
    let ignore = false;
    if (!slug) return;

    setLoading(true);
    setError(null);

    async function loadDetail() {
      try {
        const item = await api.getSticker(slug!);
        if (!ignore) {
          setSticker(item);
          api.related(item.slug, 6)
            .then((rel) => {
              if (!ignore) setRelated(rel);
            })
            .catch(() => {});
          setLoading(false);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Figurinha não encontrada.');
          setLoading(false);
        }
      }
    }

    loadDetail();
    return () => {
      ignore = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
        <Header />
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16">
          <Spinner label="Carregando figurinha..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !sticker) {
    return (
      <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
          <ErrorState message={error || 'Figurinha não encontrada.'} onRetry={() => navigate('/')} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {/* Top bar matching reference phone header */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#DFB992]/20 bg-[#13100E] px-3 py-2.5 sm:px-5 sm:py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992]"
            aria-label="Voltar"
          >
            <IconChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs text-[#C8B6A6]">
            <Link to="/" className="hover:text-[#DFB992]">
              Início
            </Link>
            {sticker.category && (
              <>
                <span className="text-[#6E6054]">/</span>
                <Link
                  to={`/?categoria=${sticker.category.slug}`}
                  className="font-medium text-[#DFB992] hover:underline"
                >
                  {sticker.category.name}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(sticker)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
              isFav
                ? 'border-[#DFB992] bg-[#DFB992] text-[#120F0D]'
                : 'border-[#DFB992]/25 bg-[#1A1614] text-[#DFB992] hover:border-[#DFB992]'
            }`}
            aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <IconHeart filled={isFav} size={17} />
          </button>
        </div>

        {/* Sticker detailed view */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Main preview box with Story background tone selector */}
          <div className="md:col-span-5">
            <div
              onContextMenu={sticker.is_premium ? (e) => e.preventDefault() : undefined}
              className={`relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-[#DFB992]/30 shadow-card transition-colors duration-300 select-none ${previewBg}`}
            >
              <img
                src={mediaUrl(sticker.image_url)}
                alt={sticker.name}
                draggable={!sticker.is_premium}
                className={`h-full w-full object-contain p-8 drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] ${
                  sticker.is_premium ? 'pointer-events-none select-none blur-[2.5px] opacity-85' : ''
                }`}
              />
              {/* Premium Watermark */}
              {sticker.is_premium && <WatermarkOverlay size="lg" />}

              {sticker.has_transparency && !sticker.is_premium && (
                <div className="absolute bottom-3 left-3 rounded-full border border-[#DFB992]/30 bg-[#12100E]/85 px-3 py-1 text-[11px] font-medium text-[#F2DEC9] backdrop-blur-md">
                  ✦ PNG Transparente
                </div>
              )}
            </div>

            {/* Background tone switcher so user can preview contrast */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-[11px] text-[#9A8978]">Fundo de teste:</span>
              {BG_SWATCHES.map((sw) => (
                <button
                  key={sw.label}
                  type="button"
                  onClick={() => setPreviewBg(sw.className)}
                  title={sw.label}
                  className={`h-6 w-6 rounded-full border transition ${sw.className} ${
                    previewBg === sw.className
                      ? 'scale-110 border-[#DFB992] ring-2 ring-[#DFB992]/40'
                      : 'border-[#DFB992]/25 opacity-75 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Details & Actions column */}
          <div className="flex flex-col md:col-span-7">
            <div>
              {sticker.is_premium && (
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#DFB992]/60 bg-[#120F0D] px-3 py-1 text-[11px] font-bold tracking-widest text-[#DFB992] uppercase shadow-sm">
                  <span>★</span>
                  <span>Exclusivo Premium</span>
                </div>
              )}
              <h1 className="font-serif text-3xl font-bold text-[#F5EDE4] sm:text-4xl">
                {sticker.name}
              </h1>
              {sticker.description && (
                <p className="mt-2 text-sm text-[#C8B6A6]">{sticker.description}</p>
              )}
            </div>

            {/* Tags */}
            {sticker.tags && sticker.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {sticker.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/busca?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-[#DFB992]/20 bg-[#151210] px-3 py-1 text-xs font-medium text-[#DFB992] transition hover:border-[#DFB992]/60"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Primary Action Buttons: Locked Card for Premium OR Regular Actions */}
            {sticker.is_premium ? (
              <div className="mt-8 rounded-3xl border border-[#DFB992]/35 bg-[#151210] p-6 shadow-card">
                <div className="flex items-center gap-2.5 text-[#DFB992]">
                  <IconLock size={20} />
                  <span className="font-serif text-lg font-bold">Conteúdo Exclusivo Premium</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#C8B6A6]">
                  Esta figurinha faz parte da galeria exclusiva Stories &amp; Stickers Premium.
                  Para proteger os direitos do criador, a cópia direta para a área de transferência e o download de arquivos originais estão bloqueados nesta página.
                </p>
                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                  <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#DFB992]/20 bg-[#1E1916] py-3 text-xs font-semibold text-[#DFB992]/70 cursor-not-allowed">
                    <IconLock size={15} />
                    <span>Cópia e Download Bloqueados</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => copy(sticker)}
                  disabled={busy === `copy:${sticker.id}`}
                  className="btn-primary min-h-[48px] flex-1 rounded-2xl text-sm"
                >
                  <IconCopy size={18} />
                  <span>Copiar para colar nos Stories</span>
                </button>

                <button
                  type="button"
                  onClick={() => download(sticker, 'original')}
                  disabled={busy === `download:${sticker.id}`}
                  className="btn-secondary min-h-[48px] flex-1 rounded-2xl text-sm"
                >
                  <IconDownload size={18} />
                  <span>Baixar PNG Transparente</span>
                </button>
              </div>
            )}

            {/* Secondary actions: share and stats */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#DFB992]/15 pt-6">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => shareLink(sticker)}
                  className="btn-secondary min-h-[38px] rounded-full text-xs"
                >
                  <IconLink size={15} />
                  <span>Copiar link</span>
                </button>
                {!sticker.is_premium && (
                  <button
                    type="button"
                    onClick={() => shareFile(sticker)}
                    className="btn-secondary min-h-[38px] rounded-full text-xs"
                  >
                    <IconShare size={15} />
                    <span>Compartilhar</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-[#8E7F70]">
                <span>{sticker.download_count} downloads</span> • <span>{sticker.copy_count} cópias</span>
              </div>
            </div>

            {/* Specs card */}
            <div className="mt-6 rounded-2xl border border-[#DFB992]/15 bg-[#141210] p-4 text-xs text-[#9A8978]">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <span className="block font-semibold text-[#DFB992]">Formato</span>
                  <span>{sticker.mime_type || 'image/png'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-[#DFB992]">Dimensões</span>
                  <span>
                    {sticker.width} x {sticker.height} px
                  </span>
                </div>
                <div>
                  <span className="block font-semibold text-[#DFB992]">Fundo</span>
                  <span>Transparente</span>
                </div>
                <div>
                  <span className="block font-semibold text-[#DFB992]">Coleção</span>
                  <span>{sticker.attribution || 'Stories & Stickers'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Stickers */}
        {related.length > 0 && (
          <section className="mt-14 border-t border-[#DFB992]/15 pt-8">
            <h2 className="mb-4 font-serif text-2xl font-bold text-[#F5EDE4]">
              Figurinhas Relacionadas
            </h2>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-6">
              {related.map((r) => (
                <StickerCard key={r.id} sticker={r} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
