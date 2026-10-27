import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { NovidadesPage } from './pages/NovidadesPage';
import { SearchPage } from './pages/SearchPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { StickerDetailPage } from './pages/StickerDetailPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { PremiumPage, SubscriptionReturnPage } from './pages/PremiumPage';
import { PrivacyPolicyPage, TermsOfServicePage } from './pages/LegalPages';
import { AuthProvider } from './lib/auth';

import { PWAInstallPrompt } from './components/PWAInstallPrompt';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explorar" element={<ExplorePage />} />
          <Route path="/novidades" element={<NovidadesPage />} />
          <Route path="/busca" element={<SearchPage />} />
          <Route path="/favoritos" element={<FavoritesPage />} />
          <Route path="/sticker/:slug" element={<StickerDetailPage />} />
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="/criar-conta" element={<RegisterPage />} />
          <Route path="/assinar" element={<PremiumPage />} />
          <Route path="/perfil" element={<SubscriptionReturnPage />} />
          <Route path="/assinatura/retorno" element={<SubscriptionReturnPage />} />
          <Route path="/privacidade" element={<PrivacyPolicyPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/termos" element={<TermsOfServicePage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PWAInstallPrompt />
      </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
export default App;
