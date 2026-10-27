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
  IconHeart,
  IconChevronLeft,
  IconLock,
} from '../components/Icons';
import { WatermarkOverlay } from '../components/WatermarkOverlay';

export function StickerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [related, setRelated] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransparent, setIsTransparent] = useState(true);
  const [customColor, setCustomColor] = useState('#E5CEB8');

  const { copy, toggleFavorite, busy } = useStickerActions();
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
              className={`relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-[#DFB992]/30 shadow-card transition-colors duration-300 select-none ${
                isTransparent ? 'checkerboard' : ''
              }`}
              style={!isTransparent ? { backgroundColor: customColor } : undefined}
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

              {/* Botão de favoritar diretamente sobre a imagem */}
              <button
                type="button"
                onClick={() => toggleFavorite(sticker)}
                className={`absolute top-3.5 left-3.5 z-20 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition duration-200 hover:scale-105 ${
                  isFav
                    ? 'border-[#DFB992] bg-[#DFB992] text-[#120F0D] shadow-glow'
                    : 'border-[#DFB992]/40 bg-[#12100E]/85 text-[#DFB992] hover:border-[#DFB992] hover:bg-[#12100E]'
                }`}
                aria-pressed={isFav}
                aria-label={isFav ? `Remover ${sticker.name} dos favoritos` : `Favoritar ${sticker.name}`}
                title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <IconHeart filled={isFav} size={18} />
              </button>

              {/* Botão de cópia rápida diretamente sobre a imagem */}
              {!sticker.is_premium && (
                <button
                  type="button"
                  onClick={() => copy(sticker)}
                  disabled={busy === `copy:${sticker.id}`}
                  className="absolute top-3.5 right-3.5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#DFB992]/40 bg-[#12100E]/85 text-[#F2DEC9] shadow-lg backdrop-blur-md transition duration-200 hover:scale-105 hover:border-[#DFB992] hover:bg-[#DFB992] hover:text-[#120F0D] disabled:opacity-50"
                  title={`Copiar ${sticker.name}`}
                  aria-label={`Copiar ${sticker.name}`}
                >
                  <IconCopy size={18} />
                </button>
              )}

              {sticker.has_transparency && !sticker.is_premium && (
                <div className="absolute bottom-3 left-3 rounded-full border border-[#DFB992]/30 bg-[#12100E]/85 px-3 py-1 text-[11px] font-medium text-[#F2DEC9] backdrop-blur-md">
                  ✦ PNG Transparente
                </div>
              )}
            </div>

            {/* Background test switcher: Default Transparent + Color Picker */}
            <div className="mt-3.5 flex items-center justify-center gap-2.5">
              <span className="text-[11px] text-[#9A8978]">Fundo de teste:</span>

              {/* Opção Transparente (Padrão) */}
              <button
                type="button"
                onClick={() => setIsTransparent(true)}
                title="Fundo transparente (padrão)"
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition duration-200 ${
                  isTransparent
                    ? 'border-[#DFB992] bg-[#1E1A17] text-[#DFB992] ring-1 ring-[#DFB992]/40 shadow-sm'
                    : 'border-[#DFB992]/25 bg-[#141210] text-[#9A8978] hover:border-[#DFB992]/50 hover:text-[#E6D5C3]'
                }`}
              >
                <span className="checkerboard h-4 w-4 shrink-0 rounded-full border border-[#DFB992]/30 shadow-inner" />
                <span>Transparente</span>
              </button>

              {/* Opção Color Picker */}
              <label
                title="Escolher cor personalizada com color picker"
                className={`relative flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition duration-200 ${
                  !isTransparent
                    ? 'border-[#DFB992] bg-[#1E1A17] text-[#DFB992] ring-1 ring-[#DFB992]/40 shadow-sm'
                    : 'border-[#DFB992]/25 bg-[#141210] text-[#9A8978] hover:border-[#DFB992]/50 hover:text-[#E6D5C3]'
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-[#DFB992]/40 shadow-inner"
                  style={{ backgroundColor: customColor }}
                />
                <span>Cor</span>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setIsTransparent(false);
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Escolher cor personalizada"
                />
              </label>
            </div>
          </div>

          {/* Details & Actions column */}
          <div className="flex flex-col md:col-span-7">
            <div>
              {sticker.is_premium && (
                <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#DFB992]/60 bg-[#120F0D] px-3 py-1 text-[11px] font-bold tracking-widest text-[#DFB992] uppercase shadow-sm">
                  <span>★</span>
                  <span>Premium</span>
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
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => copy(sticker)}
                  disabled={busy === `copy:${sticker.id}`}
                  className="btn-primary min-h-[48px] w-full rounded-2xl text-sm"
                >
                  <IconCopy size={18} />
                  <span>Copiar para colar nos Stories</span>
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 border-t border-[#DFB992]/15 pt-6 text-xs text-[#8E7F70]">
              <span>{sticker.copy_count} cópias</span>
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
