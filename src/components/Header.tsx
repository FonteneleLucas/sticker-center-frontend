import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BrandEmblem,
  IconCompass,
  IconHeart,
  IconHome,
  IconSearch,
  IconSparkles,
} from './Icons';
import { useFavorites } from '../lib/favorites';
import { useAuth } from '../lib/auth';

export function Header({
  initialQuery = '',
  hideMobileSearch = false,
}: {
  initialQuery?: string;
  hideMobileSearch?: boolean;
}) {
  const [q, setQ] = useState(initialQuery);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();
  const favs = useFavorites();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) {
      navigate(`/busca?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#DFB992]/15 bg-[#0B0908]/90 backdrop-blur-md pt-safe">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="group flex items-center gap-2.5 focus-visible:outline-offset-4"
          >
            <BrandEmblem className="h-10 w-10 transition-transform duration-300 group-hover:scale-105" />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-xl font-bold tracking-[0.18em] text-[#F5EDE4] sm:text-2xl">
                STORIES
              </span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.34em] text-[#DFB992]">
                &amp; STICKERS
              </span>
            </div>
          </Link>

          {/* Search bar on desktop */}
          <form onSubmit={handleSearch} className="hidden max-w-md flex-1 md:block">
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busque figurinhas..."
                className="w-full rounded-full border border-[#DFB992]/25 bg-[#151210]/90 py-2 pl-10 pr-4 text-sm text-[#F5EDE4] placeholder:text-[#8E7F70] focus:border-[#DFB992] focus:outline-none focus:ring-1 focus:ring-[#DFB992]"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#DFB992]/80">
                <IconSearch size={17} />
              </div>
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link
              to="/favoritos"
              className="icon-btn relative border border-[#DFB992]/20 bg-[#151210] text-[#DFB992] hover:border-[#DFB992]/50 hover:bg-[#1E1A17]"
              title="Meus Favoritos"
              aria-label="Ver favoritos"
            >
              <IconHeart size={20} filled={favs.length > 0} />
              {favs.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DFB992] px-1 text-[10px] font-extrabold text-[#120F0D]">
                  {favs.length}
                </span>
              )}
            </Link>
            {user ? (
              <>
                {!user.is_premium && (
                  <Link
                    to="/assinar"
                    className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[#DFB992]/40 bg-[#DFB992] px-3.5 py-2 text-xs font-bold text-[#120F0D] hover:bg-[#E8C9A5] active:scale-95 transition"
                  >
                    Assinar
                  </Link>
                )}
                <Link
                  to="/perfil"
                  className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#151210] px-3.5 py-2 text-xs font-semibold text-[#DFB992] hover:border-[#DFB992]/50 hover:bg-[#1E1A17] active:scale-95 transition"
                  title="Meu Perfil"
                >
                  Perfil
                </Link>
              </>
            ) : (
              <Link
                to="/entrar"
                className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-[#DFB992]/40 bg-[#DFB992] px-3.5 py-2 text-xs font-bold text-[#120F0D] hover:bg-[#E8C9A5] active:scale-95 transition"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search input (shown when not hidden by page custom search) */}
        {!hideMobileSearch && (
          <div className="border-t border-[#DFB992]/10 px-4 py-2.5 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busque figurinhas..."
                className="w-full rounded-full border border-[#DFB992]/25 bg-[#151210] py-2 pl-9 pr-4 text-xs text-[#F5EDE4] placeholder:text-[#8E7F70] focus:border-[#DFB992] focus:outline-none"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#DFB992]/80">
                <IconSearch size={15} />
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar: Inicio | Explorar | Favoritos | Novidades */}
      <nav
        aria-label="Navegação principal mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[#DFB992]/15 bg-[#0C0A09]/95 px-1 py-1.5 pb-safe backdrop-blur-lg md:hidden"
      >
        <Link
          to="/"
          className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium transition ${
            isActive('/') ? 'text-[#DFB992]' : 'text-[#8E7F70] hover:text-[#F5EDE4]'
          }`}
        >
          <IconHome size={20} filled={isActive('/')} />
          <span>Início</span>
        </Link>

        <Link
          to="/explorar"
          className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium transition ${
            isActive('/explorar') ? 'text-[#DFB992]' : 'text-[#8E7F70] hover:text-[#F5EDE4]'
          }`}
        >
          <IconCompass size={20} filled={isActive('/explorar')} />
          <span>Explorar</span>
        </Link>

        <Link
          to="/favoritos"
          className={`relative flex flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium transition ${
            isActive('/favoritos') ? 'text-[#DFB992]' : 'text-[#8E7F70] hover:text-[#F5EDE4]'
          }`}
        >
          <IconHeart size={20} filled={isActive('/favoritos')} />
          <span>Favoritos</span>
          {favs.length > 0 && (
            <span className="absolute right-3 top-0.5 h-2 w-2 rounded-full bg-[#DFB992]" />
          )}
        </Link>

        <Link
          to="/novidades"
          className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium transition ${
            isActive('/novidades') ? 'text-[#DFB992]' : 'text-[#8E7F70] hover:text-[#F5EDE4]'
          }`}
        >
          <IconSparkles size={20} />
          <span>Novidades</span>
        </Link>
      </nav>
    </>
  );
}
