import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { EmptyState, ErrorState, SkeletonGrid } from '../components/States';
import { api } from '../lib/api';
import { useDocumentMeta } from '../lib/seo';
import type { Page, Sticker, SortOption } from '../lib/types';
import { IconChevronLeft, IconHeart } from '../components/Icons';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const currentSort = (searchParams.get('ordem') as SortOption) || 'relevance';

  useDocumentMeta(
    q ? `Busca por "${q}"` : 'Buscar Figurinhas',
    `Resultados de figurinhas para ${q}`
  );

  const [stickersPage, setStickersPage] = useState<Page<Sticker> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!q.trim()) {
      setStickersPage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    async function doSearch() {
      try {
        const res = await api.search({
          q: q.trim(),
          sort: currentSort,
          page: 1,
          page_size: 48,
        });
        if (!ignore) {
          setStickersPage(res);
          setLoading(false);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Erro ao realizar pesquisa.');
          setLoading(false);
        }
      }
    }

    doSearch();
    return () => {
      ignore = true;
    };
  }, [q, currentSort]);

  const handleSortChange = (sort: SortOption) => {
    const next = new URLSearchParams(searchParams);
    next.set('ordem', sort);
    setSearchParams(next);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      <Header initialQuery={q} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8">
        {/* Top bar matching reference phone header */}
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#DFB992]/20 bg-[#13100E] px-3 py-2.5 sm:px-5 sm:py-3.5">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992]"
            aria-label="Voltar ao início"
          >
            <IconChevronLeft size={18} />
          </Link>

          <div className="text-center">
            <h1 className="font-serif text-lg font-bold text-[#F5EDE4] sm:text-2xl">
              {q ? (
                <>
                  Busca: <span className="text-[#DFB992]">&ldquo;{q}&rdquo;</span>
                </>
              ) : (
                'Buscar Figurinhas'
              )}
            </h1>
            <p className="text-[11px] text-[#9A8978]">
              {stickersPage
                ? `${stickersPage.total} figurinhas encontradas`
                : 'Digite uma palavra-chave para buscar'}
            </p>
          </div>

          <Link
            to="/favoritos"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992]"
            aria-label="Ver favoritos"
          >
            <IconHeart size={17} />
          </Link>
        </div>

        {q && (
          <div className="mb-4 flex items-center justify-end gap-2">
            <label htmlFor="sort-search" className="text-xs font-medium text-[#9A8978]">
              Ordenar por:
            </label>
            <select
              id="sort-search"
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="rounded-full border border-[#DFB992]/25 bg-[#151210] px-3 py-1 text-xs font-medium text-[#E6D5C3] focus:border-[#DFB992] focus:outline-none"
            >
              <option value="relevance">Mais relevantes</option>
              <option value="popular">Mais populares</option>
              <option value="newest">Mais recentes</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>
        )}

        {loading ? (
          <SkeletonGrid count={9} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : !q.trim() ? (
          <EmptyState
            title="Busque sua figurinha ideal"
            description="Procure por bom dia, frases, café, rotina, estética, fitness ou datas comemorativas."
            emoji="✦"
          />
        ) : stickersPage && stickersPage.items.length === 0 ? (
          <EmptyState
            title={`Nenhuma figurinha encontrada para "${q}"`}
            description="Tente pesquisar sem acentos, com sinônimos ou navegue pelas categorias na página inicial."
            emoji="✦"
            action={
              <Link to="/" className="btn-primary rounded-full">
                Ver todas as categorias
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {stickersPage?.items.map((s) => (
              <StickerCard key={s.id} sticker={s} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
