import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { useAuth } from '../lib/auth';
import { useDocumentMeta } from '../lib/seo';

function safeRedirect(v: string | null, fallback: string) {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : fallback;
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#090807]">
      <Header hideMobileSearch />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <h1 className="font-serif text-3xl text-[#F5EDE4]">{title}</h1>
        <p className="mt-1 text-sm text-[#8E7F70]">{subtitle}</p>
        <div className="mt-6 rounded-2xl border border-[#DFB992]/15 bg-[#151210] p-5">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function LoginPage() {
  useDocumentMeta('Entrar | Stories & Stickers', 'Acesse sua conta.');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'), '/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate(redirect, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Falha ao entrar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="Entrar" subtitle="Acesse sua conta para gerenciar sua assinatura Premium.">
      <div className="space-y-4">
        <GoogleAuthButton
          text="signin_with"
          onSuccess={() => navigate(redirect, { replace: true })}
          onError={(msg) => setError(msg)}
        />

        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-[#DFB992]/15" />
          <span className="bg-[#151210] px-3 text-xs uppercase tracking-wider text-[#8E7F70]">ou</span>
          <div className="w-full border-t border-[#DFB992]/15" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#8E7F70]">
          Não tem conta?{' '}
          <Link className="text-[#DFB992] underline" to={`/criar-conta?redirect=${encodeURIComponent(redirect)}`}>
            Criar conta
          </Link>
        </p>

        <p className="mt-2 text-center text-[11px] text-[#8E7F70]">
          Ao entrar, você concorda com nossos{' '}
          <Link to="/termos" className="text-[#DFB992] underline">Termos de Uso</Link> e nossa{' '}
          <Link to="/privacidade" className="text-[#DFB992] underline">Política de Privacidade</Link>.
        </p>
      </div>
    </Shell>
  );
}

export function RegisterPage() {
  useDocumentMeta('Criar conta | Stories & Stickers', 'Crie sua conta e assine o Premium.');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(email, password, name);
      navigate('/assinar', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta.');
    } finally {
      setBusy(false);
    }
  }

  const redirect = safeRedirect(params.get('redirect'), '/');
  return (
    <Shell title="Criar conta" subtitle="Depois do cadastro você escolhe seu plano e vai para o pagamento.">
      <div className="space-y-4">
        <GoogleAuthButton
          text="signup_with"
          onSuccess={() => navigate('/assinar', { replace: true })}
          onError={(msg) => setError(msg)}
        />

        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-[#DFB992]/15" />
          <span className="bg-[#151210] px-3 text-xs uppercase tracking-wider text-[#8E7F70]">ou</span>
          <div className="w-full border-t border-[#DFB992]/15" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="label">Senha (mín. 8 caracteres)</label>
            <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Criando…' : 'Criar conta e continuar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#8E7F70]">
          Já tem conta?{' '}
          <Link className="text-[#DFB992] underline" to={`/entrar?redirect=${encodeURIComponent(redirect)}`}>
            Entrar
          </Link>
        </p>

        <p className="mt-2 text-center text-[11px] text-[#8E7F70]">
          Ao criar sua conta, você concorda com nossos{' '}
          <Link to="/termos" className="text-[#DFB992] underline">Termos de Uso</Link> e nossa{' '}
          <Link to="/privacidade" className="text-[#DFB992] underline">Política de Privacidade</Link>.
        </p>
      </div>
    </Shell>
  );
}

