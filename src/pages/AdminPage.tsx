import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { api, adminToken, mediaUrl } from '../lib/api';
import { useToast } from '../components/Toast';
import type { AdminStats, Category, Sticker } from '../lib/types';
import { IconFolder, IconPlus, IconTrash } from '../components/Icons';
import { AdminBillingTab } from './AdminBillingTab';

export function AdminPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'catalog' | 'billing'>('catalog');
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
  const [selectedParentCatId, setSelectedParentCatId] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Category form (Root category)
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catCoverFile, setCatCoverFile] = useState<File | null>(null);
  const [creatingCat, setCreatingCat] = useState(false);

  // New Folder form (Child category / Subpasta)
  const [folderParentId, setFolderParentId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [folderCoverFile, setFolderCoverFile] = useState<File | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Hidden cover file input ref for quick replacement
  const [targetCoverId, setTargetCoverId] = useState<string | null>(null);
  const coverReplaceInputRef = useRef<HTMLInputElement>(null);

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
      if (cList.length > 0 && !selectedParentCatId) {
        setSelectedParentCatId(cList[0].id);
        setFolderParentId(cList[0].id);
      }
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

  // Create Sticker
  const handleCreateSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Selecione um arquivo PNG transparente.');
      return;
    }

    // Determine target category id: either folder id if selected, or parent category id
    const finalCategoryId = selectedFolderId || selectedParentCatId;
    if (!finalCategoryId) {
      toast.error('Selecione uma categoria.');
      return;
    }

    setSubmitting(true);
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    if (description) form.append('description', description);
    form.append('category_id', finalCategoryId);
    if (tags) form.append('tags', tags);
    form.append('is_featured', isFeatured ? 'true' : 'false');
    form.append('is_premium', isPremium ? 'true' : 'false');

    try {
      await api.admin.createSticker(form);
      toast.success('Figurinha cadastrada com sucesso!');
      setName('');
      setDescription('');
      setTags('');
      setFile(null);
      setIsFeatured(false);
      setIsPremium(false);
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao cadastrar figurinha.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create Root Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCreatingCat(true);
    try {
      const newCat = await api.admin.createCategory({
        name: catName.trim(),
        description: catDesc.trim() || undefined,
      });

      if (catCoverFile) {
        await api.admin.uploadCategoryCover(newCat.id, catCoverFile);
      }

      toast.success('Categoria criada com sucesso!');
      setCatName('');
      setCatDesc('');
      setCatCoverFile(null);
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar categoria.');
    } finally {
      setCreatingCat(false);
    }
  };

  // Create Folder inside Category
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    if (!folderParentId) {
      toast.error('Selecione uma categoria principal para a pasta.');
      return;
    }
    setCreatingFolder(true);
    try {
      const newFolder = await api.admin.createCategory({
        name: folderName.trim(),
        parent_id: folderParentId,
      });

      if (folderCoverFile) {
        await api.admin.uploadCategoryCover(newFolder.id, folderCoverFile);
      }

      toast.success('Pasta criada com sucesso!');
      setFolderName('');
      setFolderCoverFile(null);
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar pasta.');
    } finally {
      setCreatingFolder(false);
    }
  };

  // Quick Cover Replace
  const handleCoverReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetCoverId) return;

    try {
      await api.admin.uploadCategoryCover(targetCoverId, file);
      toast.success('Foto de capa atualizada!');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar foto de capa.');
    } finally {
      setTargetCoverId(null);
      if (coverReplaceInputRef.current) coverReplaceInputRef.current.value = '';
    }
  };

  // Delete Category or Folder
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente excluir "${name}"? Todas as subpastas vazias também serão removidas.`)) {
      return;
    }
    try {
      await api.admin.deleteCategory(id);
      toast.success('Excluído com sucesso.');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível excluir.');
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

  const handleTogglePremium = async (s: Sticker) => {
    try {
      await api.admin.updateSticker(s.id, { is_premium: !s.is_premium });
      toast.success(s.is_premium ? 'Removido de Premium.' : 'Marcado como Premium!');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar status Premium.');
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

  const selectedCategoryObj = categories.find((c) => c.id === selectedParentCatId);
  const availableFolders = selectedCategoryObj?.folders || [];

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
              Gerencie categorias com capas, pastas (subpastas) e figurinhas.
            </p>
          </div>

          <button type="button" onClick={handleLogout} className="btn-secondary rounded-full text-xs">
            Sair do Admin
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="mb-8 flex gap-2 border-b border-[#DFB992]/15 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'catalog'
                ? 'bg-[#DFB992] text-[#120F0D]'
                : 'text-[#9A8978] hover:text-[#F5EDE4] hover:bg-[#1A1714]'
            }`}
          >
            Catálogo & Figurinhas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === 'billing'
                ? 'bg-[#DFB992] text-[#120F0D]'
                : 'text-[#9A8978] hover:text-[#F5EDE4] hover:bg-[#1A1714]'
            }`}
          >
            Assinaturas, Usuários & Cupons
          </button>
        </div>

        {activeTab === 'billing' ? (
          <AdminBillingTab />
        ) : (
          <>
            {/* Hidden File Input for quick cover replacement */}
            <input
              ref={coverReplaceInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverReplace}
            />

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

        {/* Section 1 & 2: Categorias e Pastas Management */}
        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Create Category & Folder Forms */}
          <div className="space-y-6 lg:col-span-5">
            {/* Create Category Form */}
            <div className="rounded-3xl border border-[#DFB992]/20 bg-[#141210] p-6 shadow-card">
              <h2 className="font-serif text-lg font-bold text-[#F5EDE4]">
                Nova Categoria Principal
              </h2>
              <p className="mt-0.5 text-xs text-[#8E7F70]">
                Ex: Odontologia, Estética, Bom dia...
              </p>

              <form onSubmit={handleCreateCategory} className="mt-4 space-y-3.5">
                <div>
                  <label className="label">Nome da Categoria</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="input text-xs"
                    placeholder="Ex: Odontologia"
                    required
                  />
                </div>

                <div>
                  <label className="label">Descrição (opcional)</label>
                  <input
                    type="text"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="input text-xs"
                    placeholder="Ex: Coleção profissional para dentistas"
                  />
                </div>

                <div>
                  <label className="label">Foto de Fundo / Capa da Categoria (JPG/PNG/WebP)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCatCoverFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-[#C8B6A6] file:mr-3 file:rounded-full file:border-0 file:bg-[#DFB992] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#120F0D]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingCat}
                  className="btn-primary w-full rounded-full text-xs"
                >
                  {creatingCat ? 'Criando categoria...' : '+ Criar Categoria'}
                </button>
              </form>
            </div>

            {/* Create Folder (Subpasta) Form */}
            <div className="rounded-3xl border border-[#DFB992]/20 bg-[#141210] p-6 shadow-card">
              <div className="flex items-center gap-2">
                <span className="text-[#DFB992]">
                  <IconFolder size={18} />
                </span>
                <h2 className="font-serif text-lg font-bold text-[#F5EDE4]">
                  Nova Pasta / Subpasta
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-[#8E7F70]">
                Crie pastas dentro de uma categoria (Ex: Odontologia -&gt; Endodontia, HOF...)
              </p>

              <form onSubmit={handleCreateFolder} className="mt-4 space-y-3.5">
                <div>
                  <label className="label">Categoria Principal</label>
                  <select
                    value={folderParentId}
                    onChange={(e) => setFolderParentId(e.target.value)}
                    className="input text-xs"
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
                  <label className="label">Nome da Pasta</label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="input text-xs"
                    placeholder="Ex: Endodontia, HOF, Bom dia..."
                    required
                  />
                </div>

                <div>
                  <label className="label">Foto de Fundo / Capa da Pasta (opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFolderCoverFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-[#C8B6A6] file:mr-3 file:rounded-full file:border-0 file:bg-[#DFB992] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#120F0D]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingFolder || categories.length === 0}
                  className="btn-secondary w-full rounded-full text-xs"
                >
                  {creatingFolder ? 'Criando pasta...' : '+ Criar Pasta nesta Categoria'}
                </button>
              </form>
            </div>
          </div>

          {/* Categories & Folders List View with Covers */}
          <div className="rounded-3xl border border-[#DFB992]/20 bg-[#141210] p-6 shadow-card lg:col-span-7">
            <h2 className="font-serif text-xl font-bold text-[#F5EDE4]">
              Categorias &amp; Pastas Cadastradas
            </h2>
            <p className="mt-0.5 text-xs text-[#8E7F70]">
              Veja suas fotos de capa estilo Netflix e gerencie pastas vinculadas.
            </p>

            <div className="mt-5 space-y-4 max-h-[700px] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="overflow-hidden rounded-2xl border border-[#DFB992]/20 bg-[#171412] p-4 transition hover:border-[#DFB992]/40"
                >
                  {/* Category Header Row */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      {/* Cover Photo Preview */}
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-[#DFB992]/20 bg-[#0B0908]">
                        {cat.thumbnail_url ? (
                          <img
                            src={mediaUrl(cat.thumbnail_url)}
                            alt={cat.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8E7F70]">
                            Sem capa
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base font-bold text-[#F5EDE4]">
                            {cat.name}
                          </h3>
                          <span className="rounded-full bg-[#DFB992]/15 px-2 py-0.5 text-[10px] font-semibold text-[#DFB992]">
                            {cat.sticker_count} figurinhas
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8E7F70]">
                          /{cat.slug} • {cat.folders?.length || 0} pastas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetCoverId(cat.id);
                          coverReplaceInputRef.current?.click();
                        }}
                        className="rounded-full border border-[#DFB992]/30 px-3 py-1 text-[11px] font-medium text-[#DFB992] hover:bg-[#DFB992]/15"
                      >
                        Trocar Capa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="icon-btn h-8 w-8 text-[#8E7F70] hover:text-rose-400"
                        title="Excluir Categoria"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Folders (Subpastas) inside this Category */}
                  {cat.folders && cat.folders.length > 0 && (
                    <div className="mt-3.5 border-t border-[#DFB992]/10 pt-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#DFB992]/80">
                        Pastas ({cat.folders.length})
                      </span>
                      <div className="mt-2 space-y-2">
                        {cat.folders.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between rounded-xl bg-[#12100E] px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-11 shrink-0 overflow-hidden rounded-lg border border-[#DFB992]/15 bg-[#090807]">
                                {f.thumbnail_url ? (
                                  <img
                                    src={mediaUrl(f.thumbnail_url)}
                                    alt={f.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[9px] text-[#8E7F70]">
                                    Sem capa
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-[#F5EDE4]">{f.name}</span>
                                <span className="ml-2 text-[10px] text-[#8E7F70]">
                                  ({f.sticker_count} figurinhas)
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetCoverId(f.id);
                                  coverReplaceInputRef.current?.click();
                                }}
                                className="rounded-full px-2 py-0.5 text-[10px] text-[#DFB992] hover:underline"
                              >
                                Trocar Capa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(f.id, f.name)}
                                className="icon-btn h-6 w-6 text-[#8E7F70] hover:text-rose-400"
                                title="Excluir Pasta"
                              >
                                <IconTrash size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Sticker Creation Form & Table */}
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

              {/* Category Select */}
              <div>
                <label className="label">Categoria</label>
                <select
                  value={selectedParentCatId}
                  onChange={(e) => {
                    setSelectedParentCatId(e.target.value);
                    setSelectedFolderId('');
                  }}
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

              {/* Subfolder Select (if selected category has folders) */}
              {availableFolders.length > 0 && (
                <div>
                  <label className="label flex items-center justify-between">
                    <span>Pasta / Subpasta</span>
                    <span className="text-[10px] text-[#DFB992] font-normal">opcional</span>
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="input"
                  >
                    <option value="">Direto na categoria principal ({selectedCategoryObj?.name})</option>
                    {availableFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        Pasta: {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              <label className="flex items-center gap-2 rounded-xl border border-[#DFB992]/30 bg-[#171412] p-2.5">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="h-4 w-4 rounded border-[#DFB992]/40 bg-[#1C1815] text-[#DFB992] focus:ring-[#DFB992]"
                />
                <span className="text-xs font-semibold text-[#DFB992]">
                  ★ Figurinha Premium (marca d'água, fundo desfocado, cópia bloqueada)
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
                    <th className="py-2">Premium</th>
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
                          {s.category?.name || 'Sem categoria'} • {s.download_count} downloads • {s.copy_count} cópias
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
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePremium(s)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            s.is_premium
                              ? 'border border-[#DFB992]/60 bg-[#DFB992]/20 text-[#DFB992]'
                              : 'bg-[#221E1B] text-[#8E7F70]'
                          }`}
                        >
                          {s.is_premium ? '★ Premium' : 'Comum'}
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
        </>
        )}
      </main>

      <Footer />
    </div>
  );
}
