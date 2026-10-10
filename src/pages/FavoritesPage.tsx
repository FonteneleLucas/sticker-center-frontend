import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { StickerCard } from '../components/StickerCard';
import { EmptyState } from '../components/States';
import { useFavorites, favorites } from '../lib/favorites';
import { useDocumentMeta } from '../lib/seo';
import { IconTrash } from '../components/Icons';

export function FavoritesPage() {
  useDocumentMeta('Meus Favoritos', 'Seus stickers favoritados salvos localmente no seu dispositivo.');
  const favs = useFavorites();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Meus Favoritos ❤️</h1>
            <p className="mt-1 text-sm text-slate-500">
              {favs.length} {favs.length === 1 ? 'sticker salvo' : 'stickers salvos'} localmente neste navegador.
            </p>
          </div>

          {favs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja realmente limpar todos os favoritos?')) {
                  favorites.clear();
                }
              }}
              className="btn-secondary gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200"
            >
              <IconTrash size={16} />
              <span>Limpar favoritos</span>
            </button>
          )}
        </div>

        {favs.length === 0 ? (
          <EmptyState
            title="Nenhum sticker favorito ainda"
            description="Clique no coração em qualquer sticker do catálogo para guardá-lo aqui e acessá-lo rapidamente."
            emoji="🤍"
            action={
              <Link to="/" className="btn-primary">
                Explorar Catálogo
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
