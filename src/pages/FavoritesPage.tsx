import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { EmptyState } from '../components/States';
import { useFavorites, favorites } from '../lib/favorites';
import { useDocumentMeta } from '../lib/seo';
import { IconChevronLeft, IconHeart, IconTrash } from '../components/Icons';

export function FavoritesPage() {
  useDocumentMeta(
    'Meus Favoritos — Stories & Stickers',
    'Suas figurinhas favoritas salvas localmente no seu dispositivo.'
  );
  const favs = useFavorites();

  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8">
        {/* Category-style Header Bar */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#DFB992]/20 bg-[#13100E] px-3 py-2.5 sm:px-5 sm:py-3.5">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992]"
            aria-label="Voltar ao início"
          >
            <IconChevronLeft size={18} />
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[#DFB992]">
              <IconHeart size={18} filled />
            </span>
            <h1 className="font-serif text-xl font-bold tracking-wide text-[#F5EDE4] sm:text-2xl">
              Favoritos
            </h1>
          </div>

          {favs.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja realmente limpar todos os favoritos?')) {
                  favorites.clear();
                }
              }}
              className="flex h-9 items-center gap-1.5 rounded-full border border-rose-500/30 bg-[#1F1313] px-3 text-xs font-medium text-rose-300 transition hover:border-rose-400"
              title="Limpar favoritos"
            >
              <IconTrash size={14} />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          ) : (
            <div className="h-9 w-9" aria-hidden />
          )}
        </div>

        <p className="mb-4 text-xs text-[#9A8978]">
          {favs.length} {favs.length === 1 ? 'figurinha salva' : 'figurinhas salvas'} no seu dispositivo.
        </p>

        {favs.length === 0 ? (
          <EmptyState
            title="Nenhuma figurinha favorita ainda"
            description="Toque no coração no canto inferior de qualquer figurinha para salvá-la aqui e usá-la rapidamente nos seus stories."
            emoji="♡"
            action={
              <Link to="/" className="btn-primary rounded-full">
                Explorar Categorias
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {favs.map((s) => (
              <StickerCard key={s.id} sticker={s} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
