import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { api, adminToken, mediaUrl } from '../lib/api';
import { useToast } from '../components/Toast';
import type { AdminStats, Category, Sticker } from '../lib/types';
import { IconTrash, IconPlus, IconCheck } from '../components/Icons';

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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
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
    } finally {
      setLoading(false);
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
      toast.success('Sticker criado com sucesso!');
      setName('');
      setDescription('');
      setTags('');
      setFile(null);
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao cadastrar sticker.');
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
    if (!window.confirm(hard ? 'Excluir sticker permanentemente?' : 'Desativar este sticker?')) return;
    try {
      await api.admin.deleteSticker(id, hard);
      toast.success(hard ? 'Sticker excluído permanentemente.' : 'Sticker desativado.');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir sticker.');
    }
  };

  const handleToggleActive = async (s: Sticker) => {
    try {
      await api.admin.updateSticker(s.id, { is_active: !s.is_active });
      toast.success(s.is_active ? 'Sticker desativado.' : 'Sticker ativado!');
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
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">Acesso Administrativo</h1>
            <p className="mt-1 text-xs text-slate-500">
              Faça login para gerenciar catálogo, categorias e métricas.
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
                className="btn-primary w-full"
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Painel de Administração</h1>
            <p className="mt-1 text-sm text-slate-500">Gerencie stickers, categorias e visualize métricas.</p>
          </div>

          <button type="button" onClick={handleLogout} className="btn-secondary text-xs">
            Sair do Admin
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total de Stickers</span>
              <p className="mt-1 text-2xl font-black text-slate-900">{stats.stickers_total}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Stickers Ativos</span>
              <p className="mt-1 text-2xl font-black text-emerald-600">{stats.stickers_active}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Categorias</span>
              <p className="mt-1 text-2xl font-black text-slate-900">{stats.categories_total}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Downloads</span>
              <p className="mt-1 text-2xl font-black text-brand-600">{stats.downloads_total}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Cópias</span>
              <p className="mt-1 text-2xl font-black text-amber-600">{stats.copies_total}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Create Sticker Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
            <h2 className="text-lg font-bold text-slate-900">Novo Sticker</h2>
            <form onSubmit={handleCreateSticker} className="mt-4 space-y-4">
              <div>
                <label className="label">Imagem PNG (com transparência)</label>
                <input
                  type="file"
                  accept="image/png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
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
                  placeholder="Ex: Gato Feliz"
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
                  placeholder="Ex: Gatinho sorrindo e piscando"
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
                    <option key={c.id} value={c.id}>{c.name}</option>
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
                  placeholder="gato, felino, fofo, pet"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-slate-700">Destaque na página inicial</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Enviando...' : 'Cadastrar Sticker'}
              </button>
            </form>

            {/* Quick Category Creation */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-800">Criar Nova Categoria</h3>
              <form onSubmit={handleCreateCategory} className="mt-3 space-y-3">
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="input text-xs"
                  placeholder="Nome da categoria"
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
                  className="btn-secondary w-full text-xs"
                >
                  {creatingCat ? 'Criando...' : '+ Adicionar Categoria'}
                </button>
              </form>
            </div>
          </div>

          {/* Stickers Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
            <h2 className="text-lg font-bold text-slate-900">Stickers Cadastrados</h2>
            <div className="mt-4 max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="sticky top-0 bg-white text-slate-400">
                  <tr className="border-b border-slate-200">
                    <th className="py-2">Preview</th>
                    <th className="py-2">Nome</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Destaque</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stickers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2">
                        <div className="checkerboard h-10 w-10 overflow-hidden rounded-lg border border-slate-200 p-0.5">
                          <img
                            src={mediaUrl(s.thumbnail_url)}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </td>
                      <td className="py-2 font-medium text-slate-800">
                        {s.name}
                        <div className="text-[10px] text-slate-400">
                          {s.download_count} downloads • {s.copy_count} cópias
                        </div>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(s)}
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {s.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(s)}
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            s.is_featured ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {s.is_featured ? '⭐ Sim' : 'Não'}
                        </button>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteSticker(s.id, false)}
                            className="icon-btn h-7 w-7 text-slate-400 hover:text-rose-600"
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
