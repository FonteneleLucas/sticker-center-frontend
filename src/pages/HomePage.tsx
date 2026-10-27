import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { EmptyState, ErrorState, SkeletonGrid, Spinner } from '../components/States';
import { api, mediaUrl } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDocumentMeta } from '../lib/seo';
import type { Category, Page, Sticker, SortOption } from '../lib/types';
import {
  BrandEmblem,
  CategoryIcon,
  IconArrowUpRight,
  IconChevronLeft,
  IconFolder,
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
  const { user } = useAuth();

  const activeCategory = searchParams.get('categoria') || '';
  const activeFolder = searchParams.get('pasta') || '';
  const currentSort = (searchParams.get('ordem') as SortOption) || 'popular';

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [stickersPage, setStickersPage] = useState<Page<Sticker> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardBg, setCardBg] = useState<'black' | 'transparent' | 'white'>('black');

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
          folder: activeFolder || undefined,
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
  }, [activeCategory, activeFolder, currentSort, user?.is_premium]);

  const loadMore = async () => {
    if (!stickersPage || stickersPage.page >= stickersPage.pages || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = stickersPage.page + 1;
      const categoryFilter = activeCategory === 'todos' ? undefined : activeCategory;
      const res = await api.listStickers({
        category: categoryFilter,
        folder: activeFolder || undefined,
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
    next.delete('pasta');
    if (!slug) {
      next.delete('categoria');
    } else {
      next.set('categoria', slug);
    }
    setSearchParams(next);
  };

  const handleFolderSelect = (folderSlug: string) => {
    const next = new URLSearchParams(searchParams);
    if (!folderSlug) {
      next.delete('pasta');
    } else {
      next.set('pasta', folderSlug);
    }
    setSearchParams(next);
  };

  const handleBack = () => {
    if (activeFolder) {
      handleFolderSelect('');
    } else {
      handleCategorySelect('');
    }
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
  const categoryFolders = selectedCategoryObj?.folders || [];
  const selectedFolderObj = categoryFolders.find((f) => f.slug === activeFolder);

  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      <Header hideMobileSearch />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8">
        {!activeCategory ? (
          /* ================= INITIAL SCREEN: HERO + NETFLIX-STYLE CATEGORIES ================= */
          <>
            {/* Luxury Hero Banner */}
            <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#DFB992]/25 bg-gradient-to-b from-[#171310] via-[#100D0B] to-[#0B0908] px-5 py-8 text-center shadow-card sm:px-12 sm:py-12">
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
                      className="w-full rounded-full border border-[#DFB992]/30 bg-[#151210]/95 py-3 pl-11 pr-4 text-base text-[#F5EDE4] placeholder:text-[#8E7F70] shadow-inner focus:border-[#DFB992] focus:outline-none focus:ring-1 focus:ring-[#DFB992] sm:text-sm"
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#DFB992]">
                      <IconSearch size={18} />
                    </div>
                  </div>
                </form>
              </div>
            </section>

            {/* Categorias Section (Netflix-style catalog cards) */}
            <section className="mb-6">
              <div className="mb-4 flex items-center justify-between px-0.5">
                <div>
                  <h2 className="font-serif text-xl font-bold tracking-wide text-[#F5EDE4] sm:text-2xl">
                    Categorias
                  </h2>
                  <p className="text-xs text-[#8E7F70]">
                    Selecione uma categoria para explorar as pastas e figurinhas.
                  </p>
                </div>
              </div>

              {categoriesLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[9/16] animate-pulse rounded-2xl border border-[#DFB992]/15 bg-[#141210]"
                    />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <EmptyState
                  title="Nenhuma categoria cadastrada ainda"
                  description="Acesse o painel administrativo para cadastrar novas categorias e pastas."
                  emoji="✦"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.slug)}
                      className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-[#DFB992]/25 bg-[#141210] p-3.5 text-left shadow-card transition duration-300 hover:-translate-y-1 hover:border-[#DFB992]/70 hover:shadow-glow sm:p-4"
                    >
                      {/* Background Cover Photo */}
                      {cat.thumbnail_url ? (
                        <img
                          src={mediaUrl(cat.thumbnail_url)}
                          alt={cat.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#241E1A] via-[#14110F] to-[#0A0807]" />
                      )}

                      {/* Dark cinematic gradient vignette tailored for vertical 9:16 stories */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090807] via-[#090807]/75 via-45% to-black/20" />

                      {/* Card Content Overlay */}
                      <div className="relative z-10 flex h-full flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#DFB992]/30 bg-[#12100E]/85 text-[#DFB992] backdrop-blur-md">
                            <CategoryIcon slug={cat.slug} name={cat.name} size={16} />
                          </div>

                          {cat.folders && cat.folders.length > 0 ? (
                            <span className="flex items-center gap-1 rounded-full border border-[#DFB992]/30 bg-[#12100E]/85 px-2 py-0.5 text-[10px] font-semibold text-[#DFB992] backdrop-blur-md">
                              <IconFolder size={11} />
                              <span>{cat.folders.length} {cat.folders.length === 1 ? 'pasta' : 'pastas'}</span>
                            </span>
                          ) : (
                            <span className="rounded-full border border-[#DFB992]/20 bg-[#12100E]/80 px-2 py-0.5 text-[10px] font-medium text-[#C8B6A6] backdrop-blur-md">
                              {cat.sticker_count} {cat.sticker_count === 1 ? 'figurinha' : 'figurinhas'}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-serif text-base font-bold text-[#F5EDE4] drop-shadow-md sm:text-lg">
                            {cat.name}
                          </h3>
                          {cat.folders && cat.folders.length > 0 ? (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-[#DFB992]/90">
                              {cat.folders.map((f) => f.name).join(' • ')}
                            </p>
                          ) : cat.description ? (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-[#A8988B]">
                              {cat.description}
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] text-[#A8988B]">
                              {cat.sticker_count} {cat.sticker_count === 1 ? 'figurinha' : 'figurinhas'}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          /* ================= CATEGORY VIEW: < CATEGORY / PASTA ♡ + PASTAS NETFLIX + STICKERS ================= */
          <>
            {/* Category / Folder Header Bar */}
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#DFB992]/20 bg-[#13100E] px-3 py-2.5 sm:px-5 sm:py-3.5">
              <button
                type="button"
                onClick={handleBack}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992] hover:bg-[#DFB992] hover:text-[#120F0D]"
                aria-label={activeFolder ? 'Voltar para todas as pastas' : 'Voltar para categorias'}
              >
                <IconChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-2 text-center">
                <span className="text-[#DFB992]">
                  <CategoryIcon
                    slug={activeCategory}
                    name={selectedCategoryObj?.name}
                    size={18}
                  />
                </span>
                <div className="flex items-center gap-1.5 font-serif text-lg font-bold tracking-wide text-[#F5EDE4] sm:text-2xl">
                  {activeCategory === 'todos' ? (
                    <span>Todas as Figurinhas</span>
                  ) : (
                    <>
                      <span
                        onClick={() => handleFolderSelect('')}
                        className={activeFolder ? 'cursor-pointer hover:text-[#DFB992] hover:underline' : ''}
                      >
                        {selectedCategoryObj ? selectedCategoryObj.name : activeCategory}
                      </span>
                      {selectedFolderObj && (
                        <>
                          <span className="text-[#6E6054]">/</span>
                          <span className="text-[#DFB992]">{selectedFolderObj.name}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Link
                to="/favoritos"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992]"
                aria-label="Ver favoritos"
              >
                <IconHeart size={17} />
              </Link>
            </div>

            {/* Subfolders Netflix Cards & Horizontal Pills if category has folders */}
            {categoryFolders.length > 0 && (
              <section className="mb-6">
                {/* Horizontal Filter Pills */}
                <div className="no-scrollbar mb-4 flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => handleFolderSelect('')}
                    className={!activeFolder ? 'chip-active' : 'chip-inactive'}
                  >
                    Todas as pastas
                  </button>
                  {categoryFolders.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFolderSelect(f.slug)}
                      className={activeFolder === f.slug ? 'chip-active' : 'chip-inactive'}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>

                {/* Subfolder Netflix-style Cards (shown when browsing all folders in category) */}
                {!activeFolder && (
                  <div className="mb-6">
                    <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#DFB992]">
                      Pastas disponíveis
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5">
                      {categoryFolders.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleFolderSelect(f.slug)}
                          className="group relative aspect-[9/16] overflow-hidden rounded-2xl border border-[#DFB992]/25 bg-[#141210] p-3 text-left shadow-card transition duration-300 hover:-translate-y-1 hover:border-[#DFB992]/70 hover:shadow-glow"
                        >
                          {f.thumbnail_url ? (
                            <img
                              src={mediaUrl(f.thumbnail_url)}
                              alt={f.name}
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#241E1A] via-[#14110F] to-[#0A0807]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#090807] via-[#090807]/75 via-45% to-black/20" />

                          <div className="relative z-10 flex h-full flex-col justify-between">
                            <div className="flex justify-between">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#DFB992]/30 bg-[#12100E]/80 text-[#DFB992]">
                                <IconFolder size={12} />
                              </span>
                              <IconArrowUpRight size={13} className="text-[#8E7F70] group-hover:text-[#DFB992]" />
                            </div>
                            <div>
                              <h4 className="font-serif text-sm font-bold text-[#F5EDE4] drop-shadow">
                                {f.name}
                              </h4>
                              <span className="text-[10px] text-[#A8988B]">
                                {f.sticker_count} {f.sticker_count === 1 ? 'figurinha' : 'figurinhas'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Catalog Control Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#DFB992]/15 pb-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-[#9A8978]">
                  {stickersPage
                    ? `${stickersPage.total} ${stickersPage.total === 1 ? 'figurinha disponível' : 'figurinhas disponíveis'}`
                    : 'Carregando figurinhas...'}
                </span>

                {/* Seletor de fundo do card: Preto (padrão) | Transparente | Branco */}
                <div className="flex items-center gap-1 rounded-full border border-[#DFB992]/20 bg-[#151210] p-0.5 text-[11px]">
                  <span className="pl-2 pr-1 text-[10px] text-[#8E7F70]">Fundo:</span>
                  <button
                    type="button"
                    onClick={() => setCardBg('black')}
                    title="Fundo preto (padrão)"
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                      cardBg === 'black'
                        ? 'border border-[#DFB992]/60 bg-[#25201C] font-semibold text-[#DFB992]'
                        : 'text-[#A8988B] hover:text-[#E6D5C3]'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-black border border-[#DFB992]/40" />
                    <span>Preto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardBg('transparent')}
                    title="Fundo transparente"
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                      cardBg === 'transparent'
                        ? 'border border-[#DFB992]/60 bg-[#25201C] font-semibold text-[#DFB992]'
                        : 'text-[#A8988B] hover:text-[#E6D5C3]'
                    }`}
                  >
                    <span className="checkerboard h-2.5 w-2.5 rounded-full border border-[#DFB992]/40" />
                    <span>Transparente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardBg('white')}
                    title="Fundo branco"
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                      cardBg === 'white'
                        ? 'border border-[#DFB992]/60 bg-[#25201C] font-semibold text-[#DFB992]'
                        : 'text-[#A8988B] hover:text-[#E6D5C3]'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-white border border-[#DFB992]/40" />
                    <span>Branco</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-xs font-medium text-[#9A8978]">
                  Ordenar:
                </label>
                <select
                  id="sort-select"
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="rounded-full border border-[#DFB992]/25 bg-[#151210] px-3 py-1 text-base sm:text-xs font-medium text-[#E6D5C3] focus:border-[#DFB992] focus:outline-none"
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
                title="Nenhuma figurinha encontrada nesta pasta/categoria"
                description="Tente selecionar outra pasta acima ou buscar por outra palavra-chave."
                emoji="✦"
              />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {stickersPage?.items.map((s) => (
                    <StickerCard
                      key={s.id}
                      sticker={s}
                      bgClass={
                        cardBg === 'transparent'
                          ? 'checkerboard text-[#F5EDE4]'
                          : cardBg === 'white'
                            ? 'bg-white text-[#1A1614]'
                            : 'bg-black text-[#F5EDE4]'
                      }
                    />
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
