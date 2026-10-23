import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { EmptyState, ErrorState, SkeletonGrid, Spinner } from '../components/States';
import { api } from '../lib/api';
import { useDocumentMeta } from '../lib/seo';
import type { Category, Page, Sticker, SortOption } from '../lib/types';
import {
  BrandEmblem,
  CategoryIcon,
  IconArrowUpRight,
  IconChevronLeft,
  IconHeart,
  IconSearch,
} from '../components/Icons';

export function HomePage() {
  useDocumentMeta(
    'Stories & Stickers — Figurinhas para transformar seus stories',
    'Catálogo completo de figurinhas e stickers transparentes para transformar seus stories.'
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeCategory = searchParams.get('categoria') || '';
  const currentSort = (searchParams.get('ordem') as SortOption) || 'popular';

  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [stickersPage, setStickersPage] = useState<Page<Sticker> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    let ignore = false;
    setCategoriesLoading(true);
    api
      .categories()
      .then((cats) => {
        if (!ignore) {
          setCategories(cats);
          setCategoriesLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setCategoriesLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch stickers when a category is selected (or 'todos' is active)
  useEffect(() => {
    if (!activeCategory) {
      setStickersPage(null);
      setLoading(false);
      return;
    }

    let ignore = false;
    setLoading(true);
    setError(null);

    const categoryFilter = activeCategory === 'todos' ? undefined : activeCategory;

    async function fetchStickers() {
      try {
        const res = await api.listStickers({
          category: categoryFilter,
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
          setError(err.message || 'Erro ao carregar as figurinhas.');
          setLoading(false);
        }
      }
    }

    fetchStickers();
    return () => {
      ignore = true;
    };
  }, [activeCategory, currentSort]);

  const loadMore = async () => {
    if (!stickersPage || stickersPage.page >= stickersPage.pages || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = stickersPage.page + 1;
      const categoryFilter = activeCategory === 'todos' ? undefined : activeCategory;
      const res = await api.listStickers({
        category: categoryFilter,
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

  const handleCategorySelect = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (!slug) {
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

  const handleHeroSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/busca?q=${encodeURIComponent(q)}`);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.slug === activeCategory);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 9);

  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      <Header hideMobileSearch />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8">
        {!activeCategory ? (
          /* ================= INITIAL SCREEN: HERO + CATEGORIAS ONLY ================= */
          <>
            {/* Luxury Hero Banner */}
            <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#DFB992]/25 bg-gradient-to-b from-[#171310] via-[#100D0B] to-[#0B0908] px-5 py-8 text-center shadow-card sm:px-12 sm:py-12">
              {/* Decorative golden curved wave lines matching reference artwork */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
                viewBox="0 0 800 400"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M-100 320 C 150 200, 350 380, 900 140"
                  stroke="url(#goldWave)"
                  strokeWidth="1.5"
                />
                <path
                  d="M-100 350 C 180 230, 380 400, 900 180"
                  stroke="url(#goldWave)"
                  strokeWidth="1"
                  strokeOpacity="0.6"
                />
                <path
                  d="M-80 80 C 220 220, 520 20, 880 240"
                  stroke="url(#goldWave)"
                  strokeWidth="1.2"
                  strokeOpacity="0.45"
                />
                <defs>
                  <linearGradient id="goldWave" x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#DFB992" stopOpacity="0" />
                    <stop offset="50%" stopColor="#DFB992" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#DFB992" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center">
                <BrandEmblem className="mb-3 h-16 w-16 sm:h-20 sm:w-20" />

                <h1 className="font-serif text-3xl font-bold tracking-[0.2em] text-[#F5EDE4] sm:text-5xl">
                  STORIES
                </h1>
                <span className="mt-0.5 text-xs font-semibold uppercase tracking-[0.38em] text-[#DFB992] sm:text-sm">
                  &amp; STICKERS
                </span>

                <p className="mt-3 max-w-md text-xs font-normal text-[#C8B6A6] sm:text-sm">
                  Figurinhas para transformar seus stories.
                </p>

                {/* Pill Search Bar */}
                <form onSubmit={handleHeroSearch} className="mt-6 w-full max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Busque figurinhas..."
                      className="w-full rounded-full border border-[#DFB992]/30 bg-[#151210]/95 py-3 pl-11 pr-4 text-xs text-[#F5EDE4] placeholder:text-[#8E7F70] shadow-inner focus:border-[#DFB992] focus:outline-none focus:ring-1 focus:ring-[#DFB992] sm:text-sm"
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#DFB992]">
                      <IconSearch size={18} />
                    </div>
                  </div>
                </form>
              </div>
            </section>

            {/* Categorias Section (Only Categories on Initial Screen) */}
            <section className="mb-6">
              <div className="mb-3.5 flex items-center justify-between px-0.5">
                <h2 className="text-base font-semibold tracking-wide text-[#F5EDE4] sm:text-lg">
                  Categorias
                </h2>
                {categories.length > 9 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((v) => !v)}
                    className="flex items-center gap-1 text-xs font-medium text-[#DFB992] transition hover:text-[#F2DEC9]"
                  >
                    <span>{showAllCategories ? 'Ver menos' : 'Ver todas'}</span>
                    <span aria-hidden>&gt;</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('todos')}
                    className="flex items-center gap-1 text-xs font-medium text-[#DFB992] transition hover:text-[#F2DEC9]"
                  >
                    <span>Ver todas</span>
                    <span aria-hidden>&gt;</span>
                  </button>
                )}
              </div>

              {categoriesLoading ? (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="min-h-[88px] animate-pulse rounded-2xl border border-[#DFB992]/15 bg-[#141210] p-3 sm:min-h-[100px]"
                    />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <EmptyState
                  title="Nenhuma categoria cadastrada ainda"
                  description="Acesse o painel administrativo para cadastrar novas categorias e figurinhas."
                  emoji="✦"
                />
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5">
                  {visibleCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.slug)}
                      className="group relative flex min-h-[88px] flex-col justify-between rounded-2xl border border-[#DFB992]/25 bg-gradient-to-br from-[#181512] to-[#110F0D] p-3 text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-[#DFB992]/65 hover:shadow-glow sm:min-h-[100px] sm:p-4"
                    >
                      <div className="flex w-full items-start justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#DFB992]/20 bg-[#1F1A17] text-[#DFB992] transition group-hover:border-[#DFB992]/50 group-hover:bg-[#DFB992]/15">
                          <CategoryIcon slug={cat.slug} name={cat.name} size={18} />
                        </div>
                        <IconArrowUpRight
                          size={13}
                          className="text-[#8E7F70] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#DFB992]"
                        />
                      </div>
                      <span className="mt-2.5 line-clamp-2 text-[11px] font-medium leading-tight text-[#F5EDE4] sm:text-xs">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          /* ================= CATEGORY VIEW: < CATEGORY ♡ + PILLS + STICKER GRID ================= */
          <>
            {/* Category Header Bar */}
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#DFB992]/20 bg-[#13100E] px-3 py-2.5 sm:px-5 sm:py-3.5">
              <button
                type="button"
                onClick={() => handleCategorySelect('')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992] hover:bg-[#DFB992] hover:text-[#120F0D]"
                aria-label="Voltar para categorias"
              >
                <IconChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[#DFB992]">
                  <CategoryIcon
                    slug={activeCategory}
                    name={selectedCategoryObj?.name}
                    size={18}
                  />
                </span>
                <h1 className="font-serif text-xl font-bold tracking-wide text-[#F5EDE4] sm:text-2xl">
                  {activeCategory === 'todos'
                    ? 'Todas as Figurinhas'
                    : selectedCategoryObj
                      ? selectedCategoryObj.name
                      : activeCategory}
                </h1>
              </div>

              <Link
                to="/favoritos"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992]"
                aria-label="Ver favoritos"
              >
                <IconHeart size={17} />
              </Link>
            </div>

            {/* Horizontal Filter Pills Bar */}
            <section className="mb-5">
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1.5">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('todos')}
                  className={activeCategory === 'todos' ? 'chip-active' : 'chip-inactive'}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    className={activeCategory === cat.slug ? 'chip-active' : 'chip-inactive'}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Catalog Control Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#DFB992]/15 pb-3">
              <span className="text-xs font-medium text-[#9A8978]">
                {stickersPage
                  ? `${stickersPage.total} ${stickersPage.total === 1 ? 'figurinha disponível' : 'figurinhas disponíveis'}`
                  : 'Carregando figurinhas...'}
              </span>

              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-xs font-medium text-[#9A8978]">
                  Ordenar:
                </label>
                <select
                  id="sort-select"
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="rounded-full border border-[#DFB992]/25 bg-[#151210] px-3 py-1 text-xs font-medium text-[#E6D5C3] focus:border-[#DFB992] focus:outline-none"
                >
                  <option value="popular">Mais populares</option>
                  <option value="newest">Mais recentes</option>
                  <option value="name">Nome (A-Z)</option>
                </select>
              </div>
            </div>

            {/* 3-Column Vertical Stickers Grid */}
            {loading ? (
              <SkeletonGrid count={9} />
            ) : error ? (
              <ErrorState message={error} onRetry={() => window.location.reload()} />
            ) : stickersPage && stickersPage.items.length === 0 ? (
              <EmptyState
                title="Nenhuma figurinha encontrada nesta categoria"
                description="Tente selecionar outra categoria acima ou buscar por outra palavra-chave."
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
                      className="btn-secondary rounded-full px-8"
                    >
                      {loadingMore ? <Spinner label="Carregando..." /> : 'Ver mais figurinhas'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
