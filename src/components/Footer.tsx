import { Link } from 'react-router-dom';
import { BrandEmblem } from './Icons';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#DFB992]/15 bg-[#090807] pb-20 pt-8 text-sm text-[#9A8978] md:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
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
        </div>
      </div>
    </footer>
  );
}
