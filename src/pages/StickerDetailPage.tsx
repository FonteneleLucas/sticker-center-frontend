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
  IconImagePlus,
  IconShare,
  IconLink,
  IconChevronLeft,
} from '../components/Icons';

export function StickerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [related, setRelated] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { copy, download, toggleFavorite, shareLink, shareFile, busy } = useStickerActions();
  const isFav = useIsFavorite(sticker?.id || '');

  useDocumentMeta(
    sticker ? `${sticker.name}` : 'Sticker',
    sticker?.description || 'Sticker transparente para download ou edição de foto.',
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
          // fetch related
          api.related(item.slug, 8)
            .then((rel) => { if (!ignore) setRelated(rel); })
            .catch(() => {});
          setLoading(false);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Sticker não encontrado.');
          setLoading(false);
        }
      }
    }

    loadDetail();
    return () => { ignore = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-16">
          <Spinner label="Carregando detalhes do sticker..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !sticker) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
          <ErrorState message={error || 'Sticker não encontrado.'} onRetry={() => navigate('/')} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* Breadcrumb navigation */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-brand-600">Catálogo</Link>
          <span className="text-slate-300">/</span>
          {sticker.category && (
            <>
              <Link to={`/?categoria=${sticker.category.slug}`} className="hover:text-brand-600">
                {sticker.category.name}
              </Link>
              <span className="text-slate-300">/</span>
            </>
          )}
          <span className="font-semibold text-slate-800">{sticker.name}</span>
        </nav>

        {/* Sticker detailed view */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Main preview box */}
          <div className="md:col-span-6 lg:col-span-5">
            <div className="checkerboard relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
              <img
                src={mediaUrl(sticker.image_url)}
                alt={sticker.name}
                className="h-full w-full object-contain p-8 drop-shadow-md"
              />
              {sticker.has_transparency && (
                <div className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  ✨ Fundo Transparente (PNG)
                </div>
              )}
            </div>
          </div>

          {/* Details & Actions column */}
          <div className="flex flex-col md:col-span-6 lg:col-span-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">{sticker.name}</h1>
                {sticker.description && (
                  <p className="mt-2 text-base text-slate-600">{sticker.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite(sticker)}
                className={`icon-btn shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm ${
                  isFav ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                }`}
                aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar'}
              >
                <IconHeart filled={isFav} size={22} />
              </button>
            </div>

            {/* Tags */}
            {sticker.tags && sticker.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {sticker.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/busca?q=${encodeURIComponent(tag)}`}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => copy(sticker)}
                disabled={busy === `copy:${sticker.id}`}
                className="btn-primary min-h-[48px] flex-1 text-base shadow-sm"
              >
                <IconCopy size={20} />
                <span>Copiar sticker</span>
              </button>

              <button
                type="button"
                onClick={() => download(sticker, 'original')}
                disabled={busy === `download:${sticker.id}`}
                className="btn-secondary min-h-[48px] flex-1 text-base shadow-sm"
              >
                <IconDownload size={20} />
                <span>Baixar PNG original</span>
              </button>

              <Link
                to={`/editor?sticker=${encodeURIComponent(sticker.slug)}`}
                className="btn bg-amber-500 text-white hover:bg-amber-600 min-h-[48px] flex-1 text-base shadow-sm"
              >
                <IconImagePlus size={20} />
                <span>Adicionar à foto</span>
              </Link>
            </div>

            {/* Secondary actions: share and stats */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => shareLink(sticker)}
                  className="btn-secondary min-h-[38px] text-xs"
                >
                  <IconLink size={16} />
                  <span>Copiar link</span>
                </button>
                <button
                  type="button"
                  onClick={() => shareFile(sticker)}
                  className="btn-secondary min-h-[38px] text-xs"
                >
                  <IconShare size={16} />
                  <span>Compartilhar</span>
                </button>
              </div>

              <div className="text-xs text-slate-400">
                <span>{sticker.download_count} downloads</span> • <span>{sticker.copy_count} cópias</span>
              </div>
            </div>

            {/* License & specs info card */}
            <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-xs text-slate-500">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <span className="block font-semibold text-slate-700">Formato</span>
                  <span>{sticker.mime_type || 'image/png'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-700">Dimensões</span>
                  <span>{sticker.width} x {sticker.height} px</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-700">Licença</span>
                  <span>{sticker.license || 'Livre / CC0'}</span>
                </div>
                <div>
                  <span className="block font-semibold text-slate-700">Autoria</span>
                  <span>{sticker.attribution || 'StickerHub'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Stickers */}
        {related.length > 0 && (
          <section className="mt-14 border-t border-slate-200 pt-8">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Stickers Relacionados</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4">
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
