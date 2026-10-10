import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { EmptyState, ErrorState, SkeletonGrid } from '../components/States';
import { api } from '../lib/api';
import { useDocumentMeta } from '../lib/seo';
import type { Page, Sticker, SortOption } from '../lib/types';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const currentSort = (searchParams.get('ordem') as SortOption) || 'relevance';

  useDocumentMeta(q ? `Busca por "${q}"` : 'Buscar Stickers', `Resultados de stickers para ${q}`);

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
    return () => { ignore = true; };
  }, [q, currentSort]);

  const handleSortChange = (sort: SortOption) => {
    const next = new URLSearchParams(searchParams);
    next.set('ordem', sort);
    setSearchParams(next);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header initialQuery={q} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {q ? <>Resultados para <span className="text-brand-600">"{q}"</span></> : 'Pesquisar Stickers'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {stickersPage ? `${stickersPage.total} stickers encontrados` : 'Digite uma palavra-chave acima para buscar.'}
            </p>
          </div>

          {q && (
            <div className="flex items-center gap-2">
              <label htmlFor="sort-search" className="text-xs font-semibold text-slate-500">
                Ordenar por:
              </label>
              <select
                id="sort-search"
                value={currentSort}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="relevance">Mais relevantes</option>
                <option value="popular">Mais populares</option>
                <option value="newest">Mais recentes</option>
                <option value="name">Nome (A-Z)</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <SkeletonGrid count={12} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : !q.trim() ? (
          <EmptyState
            title="Comece sua busca"
            description="Procure por emoções, animais, frases, objetos ou reações."
            emoji="🔍"
          />
        ) : stickersPage && stickersPage.items.length === 0 ? (
          <EmptyState
            title={`Nenhum sticker encontrado para "${q}"`}
            description="Tente pesquisar sem acentos, com sinônimos ou navegue pelas categorias na página inicial."
            emoji="🙈"
            action={
              <Link to="/" className="btn-primary">
                Ver todos os stickers
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
