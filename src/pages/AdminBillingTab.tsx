import { useEffect, useState, type FormEvent } from 'react';
import { api, type AdminCoupon, type AdminUserPage, type AdminUserRow, type BillingSettings } from '../lib/api';
import { useToast } from '../components/Toast';

const brl = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

export function AdminBillingTab() {
  const toast = useToast();

  // 1. Settings state
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState<string>('');
  const [annualPrice, setAnnualPrice] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);

  // 2. Users state
  const [userPage, setUserPage] = useState<AdminUserPage | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userPremiumFilter, setUserPremiumFilter] = useState<'all' | 'true' | 'false'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // 3. Coupons state
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showNewCoupon, setShowNewCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponValue, setCouponValue] = useState('');
  const [couponPlan, setCouponPlan] = useState<'all' | 'monthly' | 'annual'>('all');
  const [couponUserEmail, setCouponUserEmail] = useState('');
  const [couponMaxUses, setCouponMaxUses] = useState('');
  const [couponExpiresAt, setCouponExpiresAt] = useState('');
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Load Initial Data
  const loadSettings = async () => {
    try {
      const data = await api.admin.billingSettings();
      setSettings(data);
      setMonthlyPrice(String(data.monthly_price));
      setAnnualPrice(String(data.annual_price));
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar configurações de preços.');
    }
  };

  const loadUsers = async (page = 1, q = userSearch, filter = userPremiumFilter) => {
    setLoadingUsers(true);
    try {
      const premiumParam = filter === 'all' ? undefined : filter === 'true';
      const data = await api.admin.users({
        page,
        q: q.trim() || undefined,
        premium: premiumParam,
      });
      setUserPage(data);
      setCurrentPage(data.page);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao listar usuários.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const list = await api.admin.coupons();
      setCoupons(list);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao listar cupons.');
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadUsers(1);
    loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save Pricing Settings
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    const m = parseFloat(monthlyPrice.replace(',', '.'));
    const a = parseFloat(annualPrice.replace(',', '.'));
    if (isNaN(m) || m <= 0 || isNaN(a) || a <= 0) {
      toast.error('Informe valores válidos maiores que zero.');
      return;
    }
    setSavingSettings(true);
    try {
      const updated = await api.admin.saveBillingSettings(m, a);
      setSettings(updated);
      toast.success('Preços atualizados com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Falha ao salvar configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  // User Premium Toggle
  const handleTogglePremium = async (userId: string, active: boolean | null) => {
    setTogglingUserId(userId);
    try {
      const updated = await api.admin.setPremium(userId, active);
      setUserPage((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map((u) => (u.id === userId ? updated : u)),
        };
      });
      toast.success(
        active === true
          ? 'Premium ativado manualmente!'
          : active === false
          ? 'Premium desativado manualmente!'
          : 'Controle de premium retornado ao modo automático!'
      );
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar status premium do usuário.');
    } finally {
      setTogglingUserId(null);
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault();
    const val = parseFloat(couponValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor de desconto válido.');
      return;
    }
    if (couponType === 'percent' && val > 100) {
      toast.error('O desconto percentual não pode ultrapassar 100%.');
      return;
    }

    setCreatingCoupon(true);
    try {
      const payload: Record<string, unknown> = {
        code: couponCode.trim().toUpperCase(),
        description: couponDesc.trim() || undefined,
        discount_type: couponType,
        discount_value: val,
        plan: couponPlan === 'all' ? undefined : couponPlan,
        user_email: couponUserEmail.trim() || undefined,
        max_uses: couponMaxUses.trim() ? parseInt(couponMaxUses, 10) : undefined,
        expires_at: couponExpiresAt ? new Date(couponExpiresAt).toISOString() : undefined,
        is_active: true,
      };

      await api.admin.createCoupon(payload);
      toast.success('Cupom criado com sucesso!');
      setCouponCode('');
      setCouponDesc('');
      setCouponValue('');
      setCouponUserEmail('');
      setCouponMaxUses('');
      setCouponExpiresAt('');
      setShowNewCoupon(false);
      loadCoupons();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar cupom.');
    } finally {
      setCreatingCoupon(false);
    }
  };

  // Toggle Coupon Active
  const handleToggleCoupon = async (coupon: AdminCoupon) => {
    try {
      await api.admin.updateCoupon(coupon.id, { is_active: !coupon.is_active });
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !coupon.is_active } : c))
      );
      toast.success(`Cupom ${!coupon.is_active ? 'ativado' : 'desativado'}.`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar cupom.');
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cupom permanentemente?')) return;
    try {
      await api.admin.deleteCoupon(couponId);
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      toast.success('Cupom excluído com sucesso.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir cupom.');
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. SEÇÃO: PREÇOS E STATUS */}
      <section className="rounded-2xl border border-[#DFB992]/20 bg-[#141210] p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#DFB992]/10 pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#F5EDE4]">
              Valores Base da Assinatura
            </h2>
            <p className="text-xs text-[#9A8978]">
              Defina o preço cobrado nos planos recorrentes sem plano pré-fixado no Mercado Pago.
            </p>
          </div>
          {settings && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  settings.payments_enabled
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {settings.payments_enabled ? '● MP Access Token Ativo' : '○ MP Access Token Não Configurado'}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  settings.webhook_secret_configured
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {settings.webhook_secret_configured ? '● Webhook Seguro' : '○ Webhook Secret Ausente'}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <div>
            <label className="label">Plano Mensal (R$)</label>
            <input
              type="text"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              className="input"
              placeholder="ex: 19.90"
              required
            />
          </div>
          <div>
            <label className="label">Plano Anual (R$)</label>
            <input
              type="text"
              value={annualPrice}
              onChange={(e) => setAnnualPrice(e.target.value)}
              className="input"
              placeholder="ex: 199.00"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary w-full rounded-xl py-2.5 font-medium"
            >
              {savingSettings ? 'Salvando...' : 'Atualizar Preços'}
            </button>
          </div>
        </form>
      </section>

      {/* 2. SEÇÃO: USUÁRIOS E GESTÃO DE PREMIUM */}
      <section className="rounded-2xl border border-[#DFB992]/20 bg-[#141210] p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#DFB992]/10 pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#F5EDE4]">
              Usuários e Acesso Premium
            </h2>
            <p className="text-xs text-[#9A8978]">
              Consulte usuários cadastrados e ative ou desative o Premium manualmente.
            </p>
          </div>
          {userPage && (
            <div className="text-xs text-[#9A8978]">
              Total: <span className="font-bold text-[#F5EDE4]">{userPage.total}</span> usuários | Premium Ativos:{' '}
              <span className="font-bold text-[#DFB992]">{userPage.premium_total}</span>
            </div>
          )}
        </div>

        {/* Filtros e Busca de Usuários */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers(1, userSearch, userPremiumFilter)}
              placeholder="Buscar por e-mail ou nome..."
              className="input text-xs"
            />
          </div>
          <div className="w-40">
            <select
              value={userPremiumFilter}
              onChange={(e) => {
                const val = e.target.value as 'all' | 'true' | 'false';
                setUserPremiumFilter(val);
                loadUsers(1, userSearch, val);
              }}
              className="input text-xs"
            >
              <option value="all">Todos os Status</option>
              <option value="true">Apenas Premium</option>
              <option value="false">Não Premium</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => loadUsers(1, userSearch, userPremiumFilter)}
            className="btn-secondary rounded-xl px-4 py-2 text-xs"
          >
            Buscar
          </button>
        </div>

        {/* Tabela de Usuários */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFB992]/15 text-[#9A8978]">
                <th className="py-2.5 pr-3 font-semibold">Usuário</th>
                <th className="py-2.5 px-3 font-semibold">Cadastro</th>
                <th className="py-2.5 px-3 font-semibold">Plano / Assinatura</th>
                <th className="py-2.5 px-3 font-semibold">Status Premium</th>
                <th className="py-2.5 pl-3 text-right font-semibold">Ação Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFB992]/10">
              {loadingUsers ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#9A8978]">
                    Carregando usuários...
                  </td>
                </tr>
              ) : userPage?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#9A8978]">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                userPage?.items.map((u: AdminUserRow) => {
                  const isBusy = togglingUserId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#1A1714]/60 transition">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-[#F5EDE4]">{u.email}</div>
                        {u.name && <div className="text-[11px] text-[#9A8978]">{u.name}</div>}
                      </td>
                      <td className="py-3 px-3 text-[#9A8978] whitespace-nowrap">
                        {fmtDate(u.created_at)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {u.plan ? (
                          <div>
                            <span className="font-medium text-[#DFB992]">
                              {u.plan === 'annual' ? 'Anual' : 'Mensal'}
                            </span>
                            <span className="ml-1 text-[10px] text-[#9A8978]">
                              ({u.subscription_status || 'sem status'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#8E7F70]">Sem plano ativo</span>
                        )}
                        {u.premium_until && (
                          <div className="text-[10px] text-[#9A8978]">
                            Até: {fmtDate(u.premium_until)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {u.is_premium ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-[#DFB992] border border-[#DFB992]/30">
                            ★ Premium Ativo
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-[#9A8978]">
                            Gratuito
                          </span>
                        )}
                        {u.premium_override !== null && (
                          <div className="mt-0.5 text-[10px] text-amber-400 font-medium">
                            {u.premium_override ? '(Forçado ON)' : '(Forçado OFF)'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1.5">
                          {u.premium_override !== true && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleTogglePremium(u.id, true)}
                              className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
                              title="Forçar ativação de Premium"
                            >
                              Ativar
                            </button>
                          )}
                          {u.premium_override !== false && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleTogglePremium(u.id, false)}
                              className="rounded-lg bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/30 transition disabled:opacity-50"
                              title="Forçar desativação de Premium"
                            >
                              Desativar
                            </button>
                          )}
                          {u.premium_override !== null && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleTogglePremium(u.id, null)}
                              className="rounded-lg bg-[#DFB992]/15 border border-[#DFB992]/30 px-2 py-1 text-[11px] text-[#DFB992] hover:bg-[#DFB992]/30 transition disabled:opacity-50"
                              title="Voltar ao controle automático por assinatura"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação de Usuários */}
        {userPage && userPage.pages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-[#DFB992]/10 pt-3 text-xs text-[#9A8978]">
            <span>
              Página {userPage.page} de {userPage.pages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || loadingUsers}
                onClick={() => loadUsers(currentPage - 1)}
                className="btn-secondary rounded-lg px-3 py-1 text-xs disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentPage >= userPage.pages || loadingUsers}
                onClick={() => loadUsers(currentPage + 1)}
                className="btn-secondary rounded-lg px-3 py-1 text-xs disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. SEÇÃO: CUPONS DE DESCONTO */}
      <section className="rounded-2xl border border-[#DFB992]/20 bg-[#141210] p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#DFB992]/10 pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#F5EDE4]">
              Cupons de Desconto
            </h2>
            <p className="text-xs text-[#9A8978]">
              Crie cupons gerais ou exclusivos para e-mails de usuários específicos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewCoupon(!showNewCoupon)}
            className="btn-primary rounded-xl px-4 py-2 text-xs"
          >
            {showNewCoupon ? 'Fechar Formulário' : '+ Novo Cupom'}
          </button>
        </div>

        {/* Formulário Novo Cupom */}
        {showNewCoupon && (
          <form onSubmit={handleCreateCoupon} className="mb-6 rounded-xl border border-[#DFB992]/20 bg-[#181512] p-4 text-xs space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#DFB992]">Cadastrar Novo Cupom</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Código do Cupom *</label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="EX: PROMO50"
                  className="input uppercase"
                />
              </div>
              <div>
                <label className="label">Tipo de Desconto *</label>
                <select
                  value={couponType}
                  onChange={(e) => setCouponType(e.target.value as 'percent' | 'fixed')}
                  className="input"
                >
                  <option value="percent">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="label">Valor do Desconto *</label>
                <input
                  type="text"
                  required
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                  placeholder={couponType === 'percent' ? 'ex: 20 (para 20%)' : 'ex: 10.00 (para R$ 10)'}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Restrito a Plano</label>
                <select
                  value={couponPlan}
                  onChange={(e) => setCouponPlan(e.target.value as 'all' | 'monthly' | 'annual')}
                  className="input"
                >
                  <option value="all">Válido para Todos os Planos</option>
                  <option value="monthly">Apenas Mensal</option>
                  <option value="annual">Apenas Anual</option>
                </select>
              </div>
              <div>
                <label className="label">E-mail do Usuário Específico (Opcional)</label>
                <input
                  type="email"
                  value={couponUserEmail}
                  onChange={(e) => setCouponUserEmail(e.target.value)}
                  placeholder="ex: cliente@email.com"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Limite de Usos (Opcional)</label>
                <input
                  type="number"
                  min="1"
                  value={couponMaxUses}
                  onChange={(e) => setCouponMaxUses(e.target.value)}
                  placeholder="Ilimitado se vazio"
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Data de Expiração (Opcional)</label>
                <input
                  type="date"
                  value={couponExpiresAt}
                  onChange={(e) => setCouponExpiresAt(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Descrição Interna (Opcional)</label>
                <input
                  type="text"
                  value={couponDesc}
                  onChange={(e) => setCouponDesc(e.target.value)}
                  placeholder="ex: Parceria influencer X"
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCoupon(false)}
                className="btn-secondary rounded-xl px-4 py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creatingCoupon}
                className="btn-primary rounded-xl px-5 py-2 font-semibold"
              >
                {creatingCoupon ? 'Salvando...' : 'Salvar Cupom'}
              </button>
            </div>
          </form>
        )}

        {/* Tabela de Cupons */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFB992]/15 text-[#9A8978]">
                <th className="py-2.5 pr-3 font-semibold">Código</th>
                <th className="py-2.5 px-3 font-semibold">Desconto</th>
                <th className="py-2.5 px-3 font-semibold">Destinatário</th>
                <th className="py-2.5 px-3 font-semibold">Plano</th>
                <th className="py-2.5 px-3 font-semibold">Usos</th>
                <th className="py-2.5 px-3 font-semibold">Expiração</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 pl-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFB992]/10">
              {loadingCoupons ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#9A8978]">
                    Carregando cupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#9A8978]">
                    Nenhum cupom cadastrado até o momento.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1A1714]/60 transition">
                    <td className="py-3 pr-3 font-bold text-[#DFB992]">
                      {c.code}
                      {c.description && (
                        <div className="font-normal text-[11px] text-[#9A8978]">{c.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#F5EDE4] whitespace-nowrap">
                      {c.discount_type === 'percent'
                        ? `${c.discount_value}% OFF`
                        : `${brl(c.discount_value)} OFF`}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.user_email ? (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-300 font-medium border border-amber-500/20">
                          {c.user_email}
                        </span>
                      ) : (
                        <span className="text-[#8E7F70]">Qualquer usuário</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.plan === 'monthly' ? 'Mensal' : c.plan === 'annual' ? 'Anual' : 'Todos'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.used_count} {c.max_uses ? `/ ${c.max_uses}` : 'usos'}
                    </td>
                    <td className="py-3 px-3 text-[#9A8978] whitespace-nowrap">
                      {fmtDate(c.expires_at)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(c)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                          c.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-500/25 transition"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
