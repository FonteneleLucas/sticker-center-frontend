import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { EmptyState, ErrorState, SkeletonGrid, Spinner } from '../components/States';
import { api, mediaUrl } from '../lib/api';
import { useDocumentMeta } from '../lib/seo';
import type { Category, Page, Sticker, SortOption } from '../lib/types';
import {
  CategoryIcon,
  IconChevronLeft,
  IconCompass,
  IconSearch,
  IconSparkles,
} from '../components/Icons';

const POPULAR_TAGS = [
  'bomdia',
  'odontologia',
  'frases',
  'rotina',
  'estética',
  'corações',
  'dourado',
  'minimalista',
  'stories',
  'memes',
  'natureza',
];

export function ExplorePage() {
  useDocumentMeta(
    'Explorar — Coleções e Tendências | Stories & Stickers',
    'Descubra temas em alta, categorias exclusivas e as figurinhas mais populares para os seus stories.'
  );

  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [stickersPage, setStickersPage] = useState<Page<Sticker> | null>(null);
  const [selectedSort, setSelectedSort] = useState<SortOption>('popular');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
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

  // Fetch stickers for feed
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    async function fetchStickers() {
      try {
        const res = await api.listStickers({
          sort: selectedSort,
          category: selectedCategory || undefined,
          page: 1,
          page_size: 24,
        });
        if (!ignore) {
          setStickersPage(res);
          setLoading(false);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Erro ao carregar figurinhas para explorar.');
          setLoading(false);
        }
      }
    }

    fetchStickers();
    return () => {
      ignore = true;
    };
  }, [selectedSort, selectedCategory]);

  const loadMore = async () => {
    if (!stickersPage || stickersPage.page >= stickersPage.pages || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = stickersPage.page + 1;
      const res = await api.listStickers({
        sort: selectedSort,
        category: selectedCategory || undefined,
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

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/busca?q=${encodeURIComponent(q)}`);
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
              <IconCompass size={16} />
            </span>
            <h1 className="font-serif text-lg font-bold tracking-wide text-[#F5EDE4] sm:text-2xl">
              Explorar
            </h1>
          </div>

          <div className="flex items-center">
            {stickersPage && (
              <span className="rounded-full border border-[#DFB992]/25 bg-[#1A1614] px-2.5 py-1 text-[11px] font-semibold text-[#DFB992]">
                {stickersPage.total} disponíveis
              </span>
            )}
          </div>
        </div>

        {/* Search Bar & Trending Tags section */}
        <div className="mb-8 rounded-3xl border border-[#DFB992]/25 bg-gradient-to-b from-[#181411] to-[#100D0B] p-4 shadow-card sm:p-6">
          <h2 className="mb-1 font-serif text-base font-bold text-[#F5EDE4] sm:text-lg">
            O que você quer criar hoje?
          </h2>
          <p className="mb-4 text-xs text-[#9A8978]">
            Encontre figuras para compor stories de bom dia, vendas, rotina e muito mais.
          </p>

          <form onSubmit={handleSearch} className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, tema ou palavra-chave..."
              className="w-full rounded-2xl border border-[#DFB992]/30 bg-[#13100E] py-3 pl-11 pr-24 text-xs text-[#F5EDE4] placeholder:text-[#8E7F70] focus:border-[#DFB992] focus:outline-none sm:text-sm"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#DFB992]">
              <IconSearch size={18} />
            </div>
            <button
              type="submit"
              className="btn-primary absolute right-2 top-2 h-8 rounded-xl px-4 text-xs font-semibold"
            >
              Buscar
            </button>
          </form>

          {/* Popular Tag Pills */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#DFB992]">
              <IconSparkles size={13} />
              <span>Temas populares nos Stories</span>
            </div>
            <div className="no-scrollbar flex flex-wrap gap-1.5 sm:gap-2">
              {POPULAR_TAGS.map((tag) => (
                <Link
                  key={tag}
                  to={`/busca?q=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-[#DFB992]/20 bg-[#14110E] px-3 py-1 text-xs text-[#E6D5C3] transition hover:border-[#DFB992]/60 hover:text-[#DFB992]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Categories Carousel / Quick Cards */}
        {categories.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-base font-bold text-[#F5EDE4] sm:text-lg">
                Coleções em Destaque
              </h2>
              <Link
                to="/"
                className="text-xs text-[#DFB992] hover:underline"
              >
                Ver todas no início →
              </Link>
            </div>

            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)
                  }
                  className={`group relative h-40 w-28 shrink-0 overflow-hidden rounded-2xl border text-left transition sm:h-48 sm:w-36 ${
                    selectedCategory === cat.slug
                      ? 'border-[#DFB992] ring-2 ring-[#DFB992]/40 shadow-glow'
                      : 'border-[#DFB992]/25 hover:border-[#DFB992]/60'
                  }`}
                >
                  {cat.thumbnail_url ? (
                    <img
                      src={mediaUrl(cat.thumbnail_url)}
                      alt={cat.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#241E1A] to-[#0A0807]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090807] via-[#090807]/70 to-transparent" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-2.5 sm:p-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#DFB992]/30 bg-[#12100E]/85 text-[#DFB992]">
                      <CategoryIcon slug={cat.slug} name={cat.name} size={13} />
                    </span>

                    <div>
                      <h3 className="line-clamp-2 font-serif text-xs font-bold text-[#F5EDE4] sm:text-sm">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] text-[#A8988B]">
                        {cat.sticker_count} figuras
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Discovery Feed with Controls */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#DFB992]/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-bold text-[#F5EDE4] sm:text-lg">
                {selectedCategory
                  ? `Coleção: ${categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}`
                  : 'Figurinhas em Alta'}
              </span>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="rounded-full border border-[#DFB992]/30 bg-[#1A1614] px-2 py-0.5 text-[10px] text-[#DFB992] hover:bg-[#DFB992] hover:text-[#120F0D]"
                >
                  Limpar filtro ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-explore" className="text-xs text-[#9A8978]">
                Ordenar:
              </label>
              <select
                id="sort-explore"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as SortOption)}
                className="rounded-full border border-[#DFB992]/25 bg-[#151210] px-3 py-1 text-xs text-[#E6D5C3] focus:border-[#DFB992] focus:outline-none"
              >
                <option value="popular">Mais populares</option>
                <option value="newest">Mais recentes</option>
                <option value="name">Nome (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Grid or states */}
          {loading ? (
            <SkeletonGrid count={12} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : stickersPage && stickersPage.items.length === 0 ? (
            <EmptyState
              title="Nenhuma figurinha encontrada"
              description="Tente escolher outra categoria ou buscar por outro termo."
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
                    {loadingMore ? <Spinner label="Carregando..." /> : 'Carregar mais figurinhas'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
