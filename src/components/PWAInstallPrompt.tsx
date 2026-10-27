import { useEffect, useState } from 'react';
import { BrandEmblem, IconX } from './Icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Check if device is iOS (iPhone/iPad/iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if user previously dismissed
    const hasDismissed = sessionStorage.getItem('pwa:dismissed') === 'true';
    if (hasDismissed) {
      setDismissed(true);
    }

    // Capture beforeinstallprompt for Android Chrome / Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa:dismissed', 'true');
  };

  // Do not show if already installed in standalone mode, dismissed, or not eligible
  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom-Right / Mobile-friendly Banner above bottom nav */}
      <aside
        aria-label="Instalar aplicativo"
        className="fixed bottom-16 left-3 right-3 z-50 mx-auto max-w-md animate-fade-in rounded-2xl border border-[#DFB992]/40 bg-[#14110F]/95 p-3.5 shadow-2xl backdrop-blur-xl md:bottom-6 md:left-auto md:right-6 md:w-96"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandEmblem size={38} className="shrink-0" />
            <div>
              <h4 className="font-serif text-xs font-bold tracking-wide text-[#F5EDE4]">
                Instale o Stories &amp; Stickers
              </h4>
              <p className="text-[11px] text-[#A8988B]">
                Acesse mais rápido e copie stickers direto da sua tela inicial.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-1 text-[#8E7F70] hover:text-[#F5EDE4]"
            aria-label="Fechar aviso de instalação"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl px-3 py-1.5 text-xs text-[#8E7F70] hover:text-[#F5EDE4]"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="btn-primary rounded-xl px-4 py-1.5 text-xs font-semibold shadow-md"
          >
            ✦ Instalar App
          </button>
        </div>
      </aside>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-[#DFB992]/30 bg-[#161210] p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <BrandEmblem size={48} className="mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#F5EDE4]">
              Como instalar no iPhone/iPad
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#A8988B]">
              Para instalar este aplicativo no iOS, siga estes 2 passos no Safari:
            </p>

            <div className="mt-4 space-y-3 text-left text-xs text-[#E6D5C3]">
              <div className="flex items-start gap-2.5 rounded-xl border border-[#DFB992]/15 bg-[#1C1815] p-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DFB992]/20 font-bold text-[#DFB992]">
                  1
                </span>
                <span>
                  Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra inferior do Safari.
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-[#DFB992]/15 bg-[#1C1815] p-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DFB992]/20 font-bold text-[#DFB992]">
                  2
                </span>
                <span>
                  Role a lista e selecione <strong>Adicionar à Tela de Início</strong> (ícone com símbolo +).
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="btn-primary mt-5 w-full rounded-xl py-2.5 text-xs font-semibold"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
