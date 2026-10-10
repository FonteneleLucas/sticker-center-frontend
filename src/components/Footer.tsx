import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-sm text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">StickerHub</span>
          <span>— Catálogo de stickers com fundo transparente</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <Link to="/" className="hover:text-brand-600">Catálogo</Link>
          <Link to="/favoritos" className="hover:text-brand-600">Favoritos</Link>
          <Link to="/editor" className="hover:text-brand-600">Editor</Link>
          <Link to="/criar" className="hover:text-brand-600">Criar Sticker</Link>
          <Link to="/admin" className="text-slate-400 hover:text-slate-600">Painel Admin</Link>
        </div>
      </div>
    </footer>
  );
}
