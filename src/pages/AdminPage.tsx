import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { api, adminToken, mediaUrl } from '../lib/api';
import { useToast } from '../components/Toast';
import type { AdminStats, Category, Sticker } from '../lib/types';
import { IconTrash } from '../components/Icons';

export function AdminPage() {
  const toast = useToast();

  const [token, setToken] = useState<string | null>(adminToken.get());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // New sticker form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New category form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const loadAdminData = async () => {
    try {
      const [sData, stList, cList] = await Promise.all([
        api.admin.stats(),
        api.admin.listStickers({ status: 'all', page_size: 50 }),
        api.admin.listCategories(),
      ]);
      setStats(sData);
      setStickers(stList.items);
      setCategories(cList);
      if (cList.length > 0 && !categoryId) setCategoryId(cList[0].id);
    } catch (err: any) {
      if (err.status === 401) {
        setToken(null);
        toast.error('Sessão expirada. Faça login novamente.');
      } else {
        toast.error('Erro ao carregar dados administrativos.');
      }
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await api.admin.login(email, password);
      adminToken.set(res.access_token);
      setToken(res.access_token);
      toast.success('Login administrativo realizado!');
    } catch (err: any) {
      toast.error(err.message || 'Credenciais inválidas.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    adminToken.clear();
    setToken(null);
  };

  const handleCreateSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Selecione um arquivo PNG transparente.');
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    if (description) form.append('description', description);
    form.append('category_id', categoryId);
    if (tags) form.append('tags', tags);
    form.append('is_featured', isFeatured ? 'true' : 'false');

    try {
      await api.admin.createSticker(form);
      toast.success('Figurinha cadastrada com sucesso!');
      setName('');
      setDescription('');
      setTags('');
      setFile(null);
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao cadastrar figurinha.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCreatingCat(true);
    try {
      await api.admin.createCategory({ name: catName, description: catDesc });
      toast.success('Categoria criada com sucesso!');
      setCatName('');
      setCatDesc('');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar categoria.');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleDeleteSticker = async (id: string, hard = false) => {
    if (!window.confirm(hard ? 'Excluir figurinha permanentemente?' : 'Desativar esta figurinha?'))
      return;
    try {
      await api.admin.deleteSticker(id, hard);
      toast.success(hard ? 'Figurinha excluída.' : 'Figurinha desativada.');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir figurinha.');
    }
  };

  const handleToggleActive = async (s: Sticker) => {
    try {
      await api.admin.updateSticker(s.id, { is_active: !s.is_active });
      toast.success(s.is_active ? 'Figurinha desativada.' : 'Figurinha ativada!');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar.');
    }
  };

  const handleToggleFeatured = async (s: Sticker) => {
    try {
      await api.admin.updateSticker(s.id, { is_featured: !s.is_featured });
      toast.success('Destaque atualizado!');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar.');
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
        <Header />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
          <div className="rounded-3xl border border-[#DFB992]/25 bg-[#141210] p-8 shadow-card">
            <h1 className="font-serif text-2xl font-bold text-[#F5EDE4]">Acesso Administrativo</h1>
            <p className="mt-1 text-xs text-[#9A8978]">
              Faça login para gerenciar figurinhas, categorias e métricas.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="label">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="btn-primary w-full rounded-full"
              >
                {isLoggingIn ? 'Entrando...' : 'Entrar no Painel'}
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#DFB992]/15 pb-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#F5EDE4]">
              Painel de Administração
            </h1>
            <p className="mt-1 text-xs text-[#9A8978]">
              Gerencie figurinhas, categorias e acompanhe o desempenho do catálogo.
            </p>
          </div>

          <button type="button" onClick={handleLogout} className="btn-secondary rounded-full text-xs">
            Sair do Admin
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-3.5 sm:grid-cols-5">
            <div className="rounded-2xl border border-[#DFB992]/20 bg-[#141210] p-4 shadow-card">
              <span className="text-xs font-medium text-[#9A8978]">Total de Figurinhas</span>
              <p className="mt-1 font-serif text-2xl font-bold text-[#F5EDE4]">
                {stats.stickers_total}
              </p>
            </div>
            <div className="rounded-2xl border border-[#DFB992]/20 bg-[#141210] p-4 shadow-card">
              <span className="text-xs font-medium text-[#9A8978]">Figurinhas Ativas</span>
              <p className="mt-1 font-serif text-2xl font-bold text-emerald-400">
                {stats.stickers_active}
              </p>
            </div>
            <div className="rounded-2xl border border-[#DFB992]/20 bg-[#141210] p-4 shadow-card">
              <span className="text-xs font-medium text-[#9A8978]">Categorias</span>
              <p className="mt-1 font-serif text-2xl font-bold text-[#F5EDE4]">
                {stats.categories_total}
              </p>
            </div>
            <div className="rounded-2xl border border-[#DFB992]/20 bg-[#141210] p-4 shadow-card">
              <span className="text-xs font-medium text-[#9A8978]">Total Downloads</span>
              <p className="mt-1 font-serif text-2xl font-bold text-[#DFB992]">
                {stats.downloads_total}
              </p>
            </div>
            <div className="rounded-2xl border border-[#DFB992]/20 bg-[#141210] p-4 shadow-card">
              <span className="text-xs font-medium text-[#9A8978]">Total Cópias</span>
              <p className="mt-1 font-serif text-2xl font-bold text-[#F2DEC9]">
                {stats.copies_total}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Create Sticker Form */}
          <div className="rounded-3xl border border-[#DFB992]/20 bg-[#141210] p-6 shadow-card lg:col-span-5">
            <h2 className="font-serif text-xl font-bold text-[#F5EDE4]">Nova Figurinha</h2>
            <form onSubmit={handleCreateSticker} className="mt-4 space-y-4">
              <div>
                <label className="label">Imagem PNG (com transparência)</label>
                <input
                  type="file"
                  accept="image/png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#C8B6A6] file:mr-3 file:rounded-full file:border-0 file:bg-[#DFB992] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#120F0D]"
                  required
                />
              </div>

              <div>
                <label className="label">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Ex: Bom dia iluminado"
                  required
                />
              </div>

              <div>
                <label className="label">Descrição (opcional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  placeholder="Ex: Frase de bom dia com café"
                />
              </div>

              <div>
                <label className="label">Categoria</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input"
                  placeholder="bom dia, cafe, rotina, manha"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-[#DFB992]/40 bg-[#1C1815] text-[#DFB992] focus:ring-[#DFB992]"
                />
                <span className="text-xs font-medium text-[#E6D5C3]">
                  Destaque na página inicial
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full rounded-full"
              >
                {submitting ? 'Enviando...' : 'Cadastrar Figurinha'}
              </button>
            </form>

            {/* Quick Category Creation */}
            <div className="mt-8 border-t border-[#DFB992]/15 pt-6">
              <h3 className="font-serif text-base font-bold text-[#F5EDE4]">
                Criar Nova Categoria
              </h3>
              <form onSubmit={handleCreateCategory} className="mt-3 space-y-3">
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="input text-xs"
                  placeholder="Nome da categoria (ex: Odontologia, Rotina...)"
                  required
                />
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="input text-xs"
                  placeholder="Descrição da categoria"
                />
                <button
                  type="submit"
                  disabled={creatingCat}
                  className="btn-secondary w-full rounded-full text-xs"
                >
                  {creatingCat ? 'Criando...' : '+ Adicionar Categoria'}
                </button>
              </form>
            </div>
          </div>

          {/* Stickers Table */}
          <div className="rounded-3xl border border-[#DFB992]/20 bg-[#141210] p-6 shadow-card lg:col-span-7">
            <h2 className="font-serif text-xl font-bold text-[#F5EDE4]">
              Figurinhas Cadastradas
            </h2>
            <div className="mt-4 max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs text-[#C8B6A6]">
                <thead className="sticky top-0 bg-[#141210] text-[#9A8978]">
                  <tr className="border-b border-[#DFB992]/15">
                    <th className="py-2">Preview</th>
                    <th className="py-2">Nome</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Destaque</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFB992]/10">
                  {stickers.map((s) => (
                    <tr key={s.id} className="hover:bg-[#1B1714]">
                      <td className="py-2">
                        <div className="h-11 w-9 overflow-hidden rounded-lg border border-[#DFB992]/25 bg-[#C2A385] p-1">
                          <img
                            src={mediaUrl(s.thumbnail_url)}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </td>
                      <td className="py-2 font-medium text-[#F5EDE4]">
                        {s.name}
                        <div className="text-[10px] text-[#8E7F70]">
                          {s.download_count} downloads • {s.copy_count} cópias
                        </div>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(s)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            s.is_active
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-[#221E1B] text-[#8E7F70]'
                          }`}
                        >
                          {s.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(s)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            s.is_featured
                              ? 'bg-[#DFB992]/25 text-[#DFB992]'
                              : 'bg-[#221E1B] text-[#8E7F70]'
                          }`}
                        >
                          {s.is_featured ? '✦ Sim' : 'Não'}
                        </button>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteSticker(s.id, false)}
                            className="icon-btn h-7 w-7 text-[#8E7F70] hover:text-rose-400"
                            title="Desativar"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
