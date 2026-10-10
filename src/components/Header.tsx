import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconHeart, IconImagePlus, IconSearch, IconSparkles } from './Icons';
import { useFavorites } from '../lib/favorites';

export function Header({ initialQuery = '' }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const navigate = useNavigate();
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-offset-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <svg viewBox="0 0 64 64" className="h-6 w-6" fill="currentColor">
              <path d="M20 40c0-9 7-18 16-18 5 0 8 3 8 7 0 6-8 7-12 7" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round"/>
              <path d="M44 44 L44 36 L36 44 Z" fill="#fde047" stroke="#fff" strokeWidth="3" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900">
              Sticker<span className="text-brand-600">Hub</span>
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
              placeholder="Buscar stickers por nome ou tags..."
              className="input pl-10 pr-4 text-sm"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <IconSearch size={18} />
            </div>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Link
            to="/favoritos"
            className="icon-btn relative text-slate-600 hover:bg-slate-100"
            title="Meus Favoritos"
            aria-label="Ver favoritos"
          >
            <IconHeart size={22} />
            {favs.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {favs.length}
              </span>
            )}
          </Link>

          <Link
            to="/editor"
            className="btn-secondary hidden gap-1.5 py-1.5 text-xs sm:inline-flex"
            title="Adicionar sticker sobre fotografia"
          >
            <IconImagePlus size={16} />
            <span>Editor de Foto</span>
          </Link>

          <Link
            to="/criar"
            className="btn-primary gap-1.5 py-1.5 text-xs"
            title="Criar sticker personalizado"
          >
            <IconSparkles size={16} />
            <span className="hidden min-[420px]:inline">Criar Sticker</span>
          </Link>
        </div>
      </div>

      {/* Mobile search input */}
      <div className="border-t border-slate-100 px-4 py-2 md:hidden">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar stickers..."
            className="input pl-9 pr-3 py-1.5 text-xs"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <IconSearch size={16} />
          </div>
        </form>
      </div>
    </header>
  );
}
