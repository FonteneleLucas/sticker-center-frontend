import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { EmptyState, ErrorState, SkeletonGrid, Spinner } from '../components/States';
import { api } from '../lib/api';
import { useDocumentMeta } from '../lib/seo';
import type { Category, Page, Sticker, SortOption } from '../lib/types';
import { IconSparkles, IconImagePlus } from '../components/Icons';

export function HomePage() {
  useDocumentMeta('Encontre seu sticker', 'Catálogo completo de stickers transparentes para fotos e redes sociais.');
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('categoria') || '';
  const currentSort = (searchParams.get('ordem') as SortOption) || 'popular';

  const [categories, setCategories] = useState<Category[]>([]);
  const [stickersPage, setStickersPage] = useState<Page<Sticker> | null>(null);
  const [featuredStickers, setFeaturedStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const [cats, feat] = await Promise.all([
          api.categories().catch(() => []),
          api.featured(10).catch(() => []),
        ]);
        if (!ignore) {
          setCategories(cats);
          setFeaturedStickers(feat);
        }
      } catch (err: any) {
        console.error(err);
      }
    }
    loadInitial();
    return () => { ignore = true; };
  }, []);

  // Fetch stickers when filter changes
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    async function fetchStickers() {
      try {
        const res = await api.listStickers({
          category: activeCategory || undefined,
          sort: currentSort,
          page: 1,
          page_size: 24,
        });
        if (!ignore) {
          setStickersPage(res);
          setLoading(false);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Erro ao carregar os stickers.');
          setLoading(false);
        }
      }
    }

    fetchStickers();
    return () => { ignore = true; };
  }, [activeCategory, currentSort]);

  const loadMore = async () => {
    if (!stickersPage || stickersPage.page >= stickersPage.pages || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = stickersPage.page + 1;
      const res = await api.listStickers({
        category: activeCategory || undefined,
        sort: currentSort,
        page: nextPage,
        page_size: 24,
      });
      setStickersPage({
        ...res,
        items: [...stickersPage.items, ...res.items],
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCategoryClick = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug === activeCategory) {
      next.delete('categoria');
    } else {
      next.set('categoria', slug);
    }
    setSearchParams(next);
  };

  const handleSortChange = (sort: SortOption) => {
    const next = new URLSearchParams(searchParams);
    next.set('ordem', sort);
    setSearchParams(next);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* Hero Section */}
        <div className="mb-8 rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 px-6 py-10 text-white shadow-xl sm:px-12 sm:py-14">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              Encontre seu sticker perfeito.
            </h1>
            <p className="mt-3 text-base text-brand-100 sm:text-lg">
              Copie, baixe em PNG com transparência ou aplique direto sobre suas fotos. Sem cadastro e sem limites!
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/editor" className="btn bg-white text-brand-700 hover:bg-brand-50 shadow-md">
                <IconImagePlus size={18} />
                <span>Aplicar em Foto</span>
              </Link>
              <Link to="/criar" className="btn bg-brand-500/30 text-white hover:bg-brand-500/40 backdrop-blur border border-white/20">
                <IconSparkles size={18} />
                <span>Criar Meu Próprio Sticker</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Featured carousel / quick view if no filter is active */}
        {!activeCategory && featuredStickers.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Em Destaque ⭐</h2>
            </div>
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {featuredStickers.map((s) => (
                <div key={s.id} className="w-40 shrink-0 sm:w-48">
                  <StickerCard sticker={s} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories Bar */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Categorias</h2>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => handleCategoryClick('')}
              className={`chip ${
                !activeCategory
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className={`chip ${
                  activeCategory === cat.slug
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Catalog Control Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-sm font-medium text-slate-500">
              {stickersPage ? `${stickersPage.total} stickers encontrados` : 'Carregando stickers...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs font-semibold text-slate-500">
              Ordenar por:
            </label>
            <select
              id="sort-select"
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="popular">Mais populares</option>
              <option value="newest">Mais recentes</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Stickers Grid */}
        {loading ? (
          <SkeletonGrid count={12} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : stickersPage && stickersPage.items.length === 0 ? (
          <EmptyState
            title="Nenhum sticker encontrado nesta categoria"
            description="Tente selecionar outra categoria ou buscar por outro termo."
            emoji="📦"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {stickersPage?.items.map((s) => (
                <StickerCard key={s.id} sticker={s} />
              ))}
            </div>

            {/* Load more button */}
            {stickersPage && stickersPage.page < stickersPage.pages && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn-secondary px-8 shadow-sm"
                >
                  {loadingMore ? <Spinner label="Carregando mais..." /> : 'Carregar mais stickers'}
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
