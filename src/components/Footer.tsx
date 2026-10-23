import { Link } from 'react-router-dom';
import {
  BrandEmblem,
  IconClock,
  IconDownload,
  IconFolder,
  IconHeart,
  IconSparkles,
} from './Icons';

const FEATURES = [
  {
    icon: IconFolder,
    label: 'Diversas categorias',
  },
  {
    icon: IconHeart,
    label: 'Favoritos',
  },
  {
    icon: IconClock,
    label: 'Novidades semanalmente',
  },
  {
    icon: IconDownload,
    label: 'Download fácil',
  },
  {
    icon: IconSparkles,
    label: 'Stories mais bonitos e personalizados',
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#DFB992]/15 bg-[#090807] pb-20 pt-10 text-sm text-[#9A8978] md:pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 5-Column Gold Icon Feature Strip from Reference Design */}
        <div className="mb-10 grid grid-cols-2 gap-6 border-b border-[#DFB992]/15 pb-10 sm:grid-cols-3 md:grid-cols-5">
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center text-center group"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DFB992]/30 bg-[#141210] text-[#DFB992] shadow-glow transition-transform duration-300 group-hover:scale-105 group-hover:border-[#DFB992]/60">
                  <Icon size={24} />
                </div>
                <span className="max-w-[150px] text-xs font-medium leading-snug text-[#E6D5C3]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom brand & navigation links */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <BrandEmblem className="h-8 w-8" />
            <div>
              <span className="font-serif text-sm font-bold tracking-[0.16em] text-[#F5EDE4]">
                STORIES &amp; STICKERS
              </span>
              <p className="text-xs text-[#8E7F70]">
                Figurinhas para transformar seus stories.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <Link to="/" className="text-[#C8B6A6] transition hover:text-[#DFB992]">
              Catálogo
            </Link>
            <Link to="/favoritos" className="text-[#C8B6A6] transition hover:text-[#DFB992]">
              Favoritos
            </Link>
            <Link to="/editor" className="text-[#C8B6A6] transition hover:text-[#DFB992]">
              Editor de Stories
            </Link>
            <Link to="/criar" className="text-[#C8B6A6] transition hover:text-[#DFB992]">
              Criar Figurinha
            </Link>
            <Link to="/admin" className="text-[#6E6054] transition hover:text-[#DFB992]">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
