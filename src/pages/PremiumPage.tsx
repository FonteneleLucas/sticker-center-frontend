import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { api, type PlansInfo, type Quote } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDocumentMeta } from '../lib/seo';

const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

export function PremiumPage() {
  useDocumentMeta('Assinar Premium | Stories & Stickers', 'Assine o Premium mensal ou anual.');
  const { user, loading, setUser } = useAuth();
  const [plans, setPlans] = useState<PlansInfo | null>(null);
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [code, setCode] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponErr, setCouponErr] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.billing.plans().then(setPlans).catch((e) => setError(e.message));
  }, []);

  // Se mudar de plano, o cupom precisa ser revalidado
  useEffect(() => {
    setQuote(null);
    setCouponErr('');
  }, [plan]);

  if (loading) return null;
  if (!user) return <Navigate to="/entrar?redirect=/assinar" replace />;

  const current = plans?.plans.find((p) => p.id === plan);
  const finalCents = quote ? quote.final_cents : current?.price_cents ?? 0;

  async function applyCoupon() {
    setCouponErr('');
    setQuote(null);
    if (!code.trim()) return;
    try {
      setQuote(await api.billing.validateCoupon(plan, code.trim()));
    } catch (e: any) {
      setCouponErr(e.message);
    }
  }

  async function checkout() {
    setBusy(true);
    setError('');
    try {
      const res = await api.billing.checkout(plan, quote ? code.trim() : undefined);
      if (res.free) {
        setUser(res.user);
        setDone(true);
      } else if (res.init_point) {
        window.location.href = res.init_point;
        return;
      } else {
        setError('Não foi possível iniciar o pagamento.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#090807]">
      <Header hideMobileSearch />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-serif text-3xl text-[#F5EDE4]">Seja Premium</h1>
        <p className="mt-1 text-sm text-[#8E7F70]">Libere todas as figurinhas exclusivas. Cobrança recorrente via Mercado Pago, cancele quando quiser.</p>

        {user.is_premium && (
          <div className="mt-6 rounded-xl border border-[#DFB992]/40 bg-[#DFB992]/10 p-4 text-sm text-[#F5EDE4]">
            Você já é Premium{user.premium_until ? ` até ${fmtDate(user.premium_until)}` : ''}.{' '}
            <Link to="/assinatura/retorno" className="text-[#DFB992] underline">Gerenciar assinatura</Link>
          </div>
        )}

        {done ? (
          <div className="mt-8 rounded-xl border border-green-500/40 bg-green-500/10 p-5 text-[#F5EDE4]">
            Premium ativado com sucesso! <Link to="/" className="text-[#DFB992] underline">Explorar figurinhas</Link>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {plans?.plans.map((p) => {
                const active = p.id === plan;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id)}
                    className={`rounded-2xl border p-5 text-left transition ${active ? 'border-[#DFB992] bg-[#DFB992]/10' : 'border-[#DFB992]/20 bg-[#151210] hover:border-[#DFB992]/50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-xl text-[#F5EDE4]">{p.label}</span>
                      {p.id === 'annual' && plans.annual_savings_percent > 0 && (
                        <span className="rounded-full bg-[#DFB992] px-2 py-0.5 text-xs font-bold text-[#120F0D]">
                          -{plans.annual_savings_percent}%
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-3xl font-bold text-[#DFB992]">{brl(p.price_cents)}</div>
                    <div className="text-xs text-[#8E7F70]">{p.id === 'annual' ? 'por ano' : 'por mês'}, renovação automática</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-[#DFB992]/15 bg-[#151210] p-5">
              <label className="label">Cupom de desconto</label>
              <div className="flex gap-2">
                <input className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CÓDIGO" />
                <button type="button" className="btn-secondary" onClick={applyCoupon}>Aplicar</button>
              </div>
              {couponErr && <p className="mt-2 text-sm text-red-400">{couponErr}</p>}
              {quote && (
                <p className="mt-2 text-sm text-green-400">
                  Cupom {quote.coupon_code} aplicado: -{brl(quote.discount_cents)}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-[#DFB992]/10 pt-4">
                <span className="text-[#8E7F70]">Total {plan === 'annual' ? 'anual' : 'mensal'}</span>
                <span className="text-2xl font-bold text-[#F5EDE4]">{brl(finalCents)}</span>
              </div>
              {quote && <p className="mt-1 text-xs text-[#8E7F70]">O desconto vale para todas as renovações.</p>}

              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              {plans && !plans.payments_enabled && finalCents > 0 && (
                <p className="mt-3 text-sm text-yellow-400">Pagamentos ainda não configurados no servidor.</p>
              )}
              <button className="btn-primary mt-4 w-full" onClick={checkout} disabled={busy || !plans}>
                {busy ? 'Aguarde…' : finalCents === 0 ? 'Ativar gratuitamente' : 'Ir para o pagamento'}
              </button>
              <p className="mt-2 text-center text-xs text-[#8E7F70]">Você será redirecionado ao Mercado Pago.</p>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export function SubscriptionReturnPage() {
  useDocumentMeta('Minha assinatura | Stories & Stickers', 'Status da sua assinatura Premium.');
  const { user, loading, setUser, logout } = useAuth();
  const [params] = useSearchParams();
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    api.billing
      .sync()
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  if (loading) return null;
  if (!user) return <Navigate to="/entrar?redirect=/assinatura/retorno" replace />;

  const sub = user.subscription;
  const returned = params.has('sub');

  async function cancel() {
    if (!window.confirm('Cancelar a renovação da assinatura? O acesso continua até o fim do período pago.')) return;
    setCancelling(true);
    try {
      setUser(await api.billing.cancel());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  }

  let message = returned ? 'Sua assinatura' : 'Meu Perfil';
  if (syncing) message = 'Confirmando pagamento…';
  else if (returned && user.is_premium) message = 'Pagamento confirmado! Bem-vindo ao Premium.';
  else if (returned && sub?.status === 'pending') message = 'Pagamento pendente. Assim que o Mercado Pago confirmar, o acesso é liberado.';
  else if (returned) message = 'Não identificamos um pagamento aprovado.';

  return (
    <div className="flex min-h-screen flex-col bg-[#090807]">
      <Header hideMobileSearch />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12">
        <h1 className="font-serif text-3xl text-[#F5EDE4]">{message}</h1>
        <div className="mt-6 space-y-2 rounded-2xl border border-[#DFB992]/15 bg-[#151210] p-5 text-sm text-[#F5EDE4]">
          {user.name && <div>Nome: <span className="font-semibold">{user.name}</span></div>}
          <div>E-mail: <span className="font-semibold">{user.email}</span></div>
          <div>Plano: <span className="font-semibold text-[#DFB992]">{user.is_premium ? '★ Premium Ativo' : 'Gratuito'}</span></div>
          {sub && (
            <>
              <div>Assinatura: {sub.plan === 'annual' ? 'Anual' : 'Mensal'} ({sub.status})</div>
              <div>Valor: {brl(sub.amount_cents)}{sub.coupon_code ? ` (cupom ${sub.coupon_code})` : ''}</div>
              <div>Próxima renovação: {fmtDate(sub.next_payment_date)}</div>
            </>
          )}
          {user.premium_until && <div>Acesso válido até: {fmtDate(user.premium_until)}</div>}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link to="/" className="btn-primary">Explorar figurinhas</Link>
          {!user.is_premium && <Link to="/assinar" className="btn-secondary">Assinar Premium</Link>}
          {sub?.status === 'authorized' && (
            <button className="btn-secondary" onClick={cancel} disabled={cancelling}>
              {cancelling ? 'Cancelando…' : 'Cancelar assinatura'}
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition ml-auto"
            title="Encerrar sessão"
          >
            Sair da conta
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
