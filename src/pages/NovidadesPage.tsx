import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { EmptyState, ErrorState, SkeletonGrid, Spinner } from '../components/States';
import { api } from '../lib/api';
import { useDocumentMeta } from '../lib/seo';
import type { Page, Sticker } from '../lib/types';
import { IconChevronLeft, IconSparkles } from '../components/Icons';

export function NovidadesPage() {
  useDocumentMeta(
    'Novidades — Figurinhas Recentes | Stories & Stickers',
    'Confira as últimas figurinhas adicionadas recentemente ao catálogo para renovar seus stories.'
  );

  const [stickersPage, setStickersPage] = useState<Page<Sticker> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    async function fetchNewest() {
      try {
        const res = await api.listStickers({
          sort: 'newest',
          page: 1,
          page_size: 24,
        });
        if (!ignore) {
          setStickersPage(res);
          setLoading(false);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Erro ao carregar as figurinhas recentes.');
          setLoading(false);
        }
      }
    }

    fetchNewest();
    return () => {
      ignore = true;
    };
  }, []);

  const loadMore = async () => {
    if (!stickersPage || stickersPage.page >= stickersPage.pages || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = stickersPage.page + 1;
      const res = await api.listStickers({
        sort: 'newest',
        page: nextPage,
        page_size: 24,
      });
      setStickersPage({
        ...res,
        items: [...stickersPage.items, ...res.items],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8">
        {/* Header Bar */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#DFB992]/20 bg-[#13100E] px-3 py-2.5 sm:px-5 sm:py-3.5">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992]"
            aria-label="Voltar ao início"
          >
            <IconChevronLeft size={18} />
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#DFB992]/30 bg-[#1A1614] text-[#DFB992]">
              <IconSparkles size={16} />
            </span>
            <div className="flex flex-col text-left">
              <h1 className="font-serif text-lg font-bold tracking-wide text-[#F5EDE4] sm:text-2xl">
                Novidades
              </h1>
            </div>
          </div>

          <div className="flex items-center">
            {stickersPage && (
              <span className="rounded-full border border-[#DFB992]/25 bg-[#1A1614] px-2.5 py-1 text-[11px] font-semibold text-[#DFB992]">
                {stickersPage.total} {stickersPage.total === 1 ? 'nova' : 'novas'}
              </span>
            )}
          </div>
        </div>

        {/* Subtitle / Context description */}
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#9A8978]">
            Últimas figurinhas transparentes adicionadas ao catálogo para transformar seus stories.
          </p>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#DFB992]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#DFB992] animate-pulse" />
            <span>Atualizado com as adições mais recentes</span>
          </span>
        </div>

        {/* Grid or states */}
        {loading ? (
          <SkeletonGrid count={12} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : stickersPage && stickersPage.items.length === 0 ? (
          <EmptyState
            title="Nenhuma novidade encontrada"
            description="Fique de olho! Novas figurinhas serão adicionadas em breve."
            emoji="✦"
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {stickersPage?.items.map((s) => (
                <StickerCard key={s.id} sticker={s} />
              ))}
            </div>

            {stickersPage && stickersPage.page < stickersPage.pages && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn-secondary rounded-full px-8 py-2.5 text-xs font-semibold"
                >
                  {loadingMore ? <Spinner label="Carregando..." /> : 'Carregar mais novidades'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
