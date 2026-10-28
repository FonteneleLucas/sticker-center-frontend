import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { api, type PlansInfo, type Quote, type PixCheckoutData } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDocumentMeta } from '../lib/seo';

const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

export function PremiumPage() {
  useDocumentMeta('Assinar Premium | Stories & Stickers', 'Assine o Premium mensal ou anual via Pix ou Cartão.');
  const { user, loading, setUser } = useAuth();
  const [plans, setPlans] = useState<PlansInfo | null>(null);
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [pixData, setPixData] = useState<PixCheckoutData | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [code, setCode] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponErr, setCouponErr] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.billing.plans().then(setPlans).catch((e) => setError(e.message));
  }, []);

  // Se mudar de plano, revalida cupom e reseta dados de pix
  useEffect(() => {
    setQuote(null);
    setCouponErr('');
    setPixData(null);
  }, [plan]);

  // Polling automático para aprovação do Pix
  useEffect(() => {
    if (!pixData || done) return;
    let active = true;

    const check = async () => {
      try {
        const res = await api.billing.pixStatus(pixData.payment_id);
        if (!active) return;
        if (res.approved) {
          if (res.user) setUser(res.user);
          setDone(true);
          setPixData(null);
        }
      } catch {
        // Ignora erros temporários de conexão durante polling
      }
    };

    const timer = setInterval(check, 3500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pixData, done, setUser]);

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
      if (finalCents === 0) {
        // Cupom de 100% ou plano gratuito
        const res = await api.billing.checkout(plan, quote ? code.trim() : undefined);
        if (res.free) {
          setUser(res.user);
          setDone(true);
        }
        return;
      }

      if (paymentMethod === 'pix') {
        const res = await api.billing.checkoutPix(plan, quote ? code.trim() : undefined);
        setPixData(res);
      } else {
        const res = await api.billing.checkout(plan, quote ? code.trim() : undefined);
        if (res.init_point) {
          window.location.href = res.init_point;
          return;
        } else {
          setError('Não foi possível iniciar o checkout com cartão.');
        }
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
        <p className="mt-1 text-sm text-[#8E7F70]">Libere todas as figurinhas exclusivas via Pix ou Cartão de Crédito.</p>

        {user.is_premium && (
          <div className="mt-6 rounded-xl border border-[#DFB992]/40 bg-[#DFB992]/10 p-4 text-sm text-[#F5EDE4]">
            Você já é Premium{user.premium_until ? ` até ${fmtDate(user.premium_until)}` : ''}.{' '}
            <Link to="/assinatura/retorno" className="text-[#DFB992] underline">Gerenciar assinatura</Link>
          </div>
        )}

        {done ? (
          <div className="mt-8 rounded-2xl border border-green-500/40 bg-green-500/10 p-6 text-[#F5EDE4]">
            <div className="font-semibold text-green-400 text-lg">Pagamento confirmado com sucesso! 🎉</div>
            <p className="mt-2 text-sm text-[#F5EDE4]">
              Seu acesso Premium já está liberado. Baixe e copie todas as figurinhas exclusivas agora mesmo!
            </p>
            <div className="mt-5 flex gap-3">
              <Link to="/" className="btn-primary">Explorar figurinhas</Link>
              <Link to="/assinatura/retorno" className="btn-secondary">Ver minha conta</Link>
            </div>
          </div>
        ) : pixData ? (
          <div className="mt-8 rounded-2xl border border-[#DFB992]/30 bg-[#151210] p-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#DFB992]/10 border border-[#DFB992]/30 px-3 py-1 text-xs font-semibold text-[#DFB992]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DFB992] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DFB992]"></span>
              </span>
              Aguardando pagamento Pix
            </div>

            <h2 className="mt-4 font-serif text-2xl text-[#F5EDE4]">
              Pague {brl(pixData.amount_cents)} via Pix
            </h2>
            <p className="mt-1 text-xs text-[#8E7F70]">
              Plano {pixData.plan === 'annual' ? 'Anual (365 dias de acesso)' : 'Mensal (30 dias de acesso)'}
            </p>

            {pixData.qr_code_base64 && (
              <div className="mt-5 inline-block rounded-2xl bg-white p-3 shadow-lg">
                <img
                  src={`data:image/png;base64,${pixData.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="h-52 w-52 object-contain"
                />
              </div>
            )}

            <div className="mt-5 text-left max-w-md mx-auto">
              <label className="text-xs font-medium text-[#8E7F70]">Pix Copia e Cola</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.qr_code}
                  className="input font-mono text-xs truncate bg-[#1b1714]"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pixData.qr_code);
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 3000);
                  }}
                  className="btn-primary shrink-0 px-4 py-2 text-xs font-semibold"
                >
                  {copiedPix ? '✓ Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-[#120F0D] p-4 text-xs text-[#8E7F70] text-left max-w-md mx-auto space-y-1 border border-[#DFB992]/10">
              <div className="text-[#F5EDE4] font-medium mb-1">Como pagar:</div>
              <div>1. Abra o app do seu banco ou carteira digital.</div>
              <div>2. Escolha **Pix**, aponte a câmera para o QR Code ou cole o código acima.</div>
              <div>3. Assim que confirmado, esta tela atualizará automaticamente!</div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPixData(null)}
                className="text-xs text-[#8E7F70] hover:text-[#F5EDE4] underline transition"
              >
                Voltar e escolher outra forma de pagamento
              </button>
              {pixData.ticket_url && (
                <a
                  href={pixData.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#DFB992] hover:underline"
                >
                  Abrir no Mercado Pago ↗
                </a>
              )}
            </div>
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
                    <div className="text-xs text-[#8E7F70]">
                      {p.id === 'annual' ? 'por ano' : 'por mês'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-[#DFB992]/15 bg-[#151210] p-5">
              <label className="label">Forma de pagamento</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`rounded-xl border p-3.5 text-left transition flex items-center gap-3 ${
                    paymentMethod === 'pix'
                      ? 'border-[#DFB992] bg-[#DFB992]/15 text-[#F5EDE4]'
                      : 'border-[#DFB992]/20 bg-[#120F0D] text-[#8E7F70] hover:border-[#DFB992]/40'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-[#F5EDE4]">Pix</div>
                    <div className="text-[11px] text-[#8E7F70]">Aprovação imediata</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`rounded-xl border p-3.5 text-left transition flex items-center gap-3 ${
                    paymentMethod === 'card'
                      ? 'border-[#DFB992] bg-[#DFB992]/15 text-[#F5EDE4]'
                      : 'border-[#DFB992]/20 bg-[#120F0D] text-[#8E7F70] hover:border-[#DFB992]/40'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-[#F5EDE4]">Cartão ou Conta Mercado Pago</div>
                    <div className="text-[11px] text-[#8E7F70]">Renovação automática</div>
                  </div>
                </button>
              </div>
              <p className="mt-2 text-xs text-[#8E7F70]">
                {paymentMethod === 'pix'
                  ? `Pagamento único via Pix. Acesso liberado por ${plan === 'annual' ? '365 dias' : '30 dias'} sem cobranças automáticas no futuro.`
                  : `Assinatura com cobrança recorrente no cartão a cada ${plan === 'annual' ? 'ano' : 'mês'}. Cancele quando quiser.`}
              </p>

              <div className="mt-5 border-t border-[#DFB992]/10 pt-4">
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
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#DFB992]/10 pt-4">
                <span className="text-[#8E7F70]">Total {plan === 'annual' ? 'anual' : 'mensal'}</span>
                <span className="text-2xl font-bold text-[#F5EDE4]">{brl(finalCents)}</span>
              </div>
              {quote && paymentMethod === 'card' && (
                <p className="mt-1 text-xs text-[#8E7F70]">O desconto vale para todas as renovações.</p>
              )}

              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              {plans && !plans.payments_enabled && finalCents > 0 && (
                <p className="mt-3 text-sm text-yellow-400">Pagamentos ainda não configurados no servidor.</p>
              )}
              <button className="btn-primary mt-4 w-full" onClick={checkout} disabled={busy || !plans}>
                {busy
                  ? 'Aguarde…'
                  : finalCents === 0
                  ? 'Ativar gratuitamente'
                  : paymentMethod === 'pix'
                  ? 'Gerar código Pix'
                  : 'Pagar com Cartão'}
              </button>
              {paymentMethod === 'card' && finalCents > 0 && (
                <p className="mt-2 text-center text-xs text-[#8E7F70]">Você será redirecionado ao Mercado Pago.</p>
              )}
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
              <div>Tipo: <span className="font-semibold">{sub.provider === 'mercadopago_pix' ? 'Pagamento Pix' : 'Assinatura Recorrente'}</span></div>
              <div>Plano: {sub.plan === 'annual' ? 'Anual' : 'Mensal'} ({sub.status})</div>
              <div>Valor: {brl(sub.amount_cents)}{sub.coupon_code ? ` (cupom ${sub.coupon_code})` : ''}</div>
              {sub.next_payment_date && <div>Próxima renovação: {fmtDate(sub.next_payment_date)}</div>}
            </>
          )}
          {user.premium_until && <div>Acesso válido até: {fmtDate(user.premium_until)}</div>}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link to="/" className="btn-primary">Explorar figurinhas</Link>
          {!user.is_premium && <Link to="/assinar" className="btn-secondary">Assinar Premium</Link>}
          {sub?.provider !== 'mercadopago_pix' && sub?.status === 'authorized' && (
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
