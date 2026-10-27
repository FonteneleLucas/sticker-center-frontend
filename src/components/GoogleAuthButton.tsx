import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

declare global {
  interface Window {
    google?: any;
  }
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface GoogleAuthButtonProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export function GoogleAuthButton({ onSuccess, onError, text = 'continue_with' }: GoogleAuthButtonProps) {
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(
    (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || null
  );
  const [loading, setLoading] = useState(!clientId);
  const [configured, setConfigured] = useState(true);

  // Busca o Client ID no backend se não estiver configurado nas variáveis de ambiente do Vite
  useEffect(() => {
    if (clientId) {
      setLoading(false);
      return;
    }
    let ignore = false;
    api.auth
      .googleClientId()
      .then((res) => {
        if (ignore) return;
        if (res.client_id) {
          setClientId(res.client_id.trim());
        } else {
          setConfigured(false);
        }
      })
      .catch(() => {
        if (!ignore) setConfigured(false);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;

    // Carrega o script oficial do Google Identity Services caso ainda não exista
    let script = document.getElementById('google-gsi-client') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const render = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) {
              onError('Credencial do Google não recebida.');
              return;
            }
            try {
              await loginWithGoogle(response.credential);
              onSuccess();
            } catch (err: any) {
              onError(err.message || 'Falha ao autenticar com o Google.');
            }
          },
        });

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text,
          shape: 'pill',
          logo_alignment: 'left',
          width: containerRef.current.offsetWidth || 340,
        });
      } catch (err) {
        console.error('Erro ao renderizar botão do Google:', err);
      }
    };

    if (window.google?.accounts?.id) {
      render();
    } else {
      script.onload = render;
    }
  }, [clientId, loginWithGoogle, onSuccess, onError, text]);

  if (loading) {
    return (
      <div className="flex h-11 w-full animate-pulse items-center justify-center rounded-full bg-[#1F1B18] text-xs text-[#8E7F70]">
        Carregando login com Google…
      </div>
    );
  }

  if (!configured || !clientId) {
    return (
      <button
        type="button"
        onClick={() => {
          onError('O login com Google requer a configuração do GOOGLE_CLIENT_ID nas configurações.');
        }}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-[#DFB992]/20 bg-[#1A1614] px-4 py-2.5 text-sm font-medium text-[#F5EDE4] transition hover:border-[#DFB992]/40 hover:bg-[#231F1C]"
      >
        <GoogleIcon />
        <span>Continuar com o Google</span>
      </button>
    );
  }

  return (
    <div className="flex w-full justify-center overflow-hidden">
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  );
}
