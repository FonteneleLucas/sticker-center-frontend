import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { StickerDetailPage } from './pages/StickerDetailPage';
import { PhotoEditorPage } from './pages/PhotoEditorPage';
import { CreateStickerPage } from './pages/CreateStickerPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/busca" element={<SearchPage />} />
          <Route path="/favoritos" element={<FavoritesPage />} />
          <Route path="/sticker/:slug" element={<StickerDetailPage />} />
          <Route path="/editor" element={<PhotoEditorPage />} />
          <Route path="/criar" element={<CreateStickerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
export default App;
