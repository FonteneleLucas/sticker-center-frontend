import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';
import type Konva from 'konva';
import { api, mediaUrl } from '../lib/api';
import { useDocumentMeta } from '../lib/seo';
import { useToast } from '../components/Toast';
import { downloadBlob, loadImage } from '../lib/image';
import type { Sticker, Category } from '../lib/types';
import {
  IconCamera,
  IconDownload,
  IconRedo,
  IconTrash,
  IconUndo,
  IconText,
  IconPlus,
  IconX,
  IconChevronLeft,
} from '../components/Icons';

interface CanvasItem {
  id: string;
  type: 'sticker' | 'text';
  imageObj?: HTMLImageElement;
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  fontSize?: number;
  fill?: string;
}

export function PhotoEditorPage() {
  useDocumentMeta(
    'Editor de Stories — Stories & Stickers',
    'Aplique figurinhas e textos sobre suas fotos de forma rápida para seus stories.'
  );
  const [searchParams] = useSearchParams();
  const initialStickerSlug = searchParams.get('sticker');
  const toast = useToast();

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 540, height: 680 });
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // History for Undo/Redo
  const [history, setHistory] = useState<CanvasItem[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  // Sticker Picker Modal / Drawer state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerStickers, setPickerStickers] = useState<Sticker[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pushHistory = (newItems: CanvasItem[]) => {
    const updatedHistory = history.slice(0, historyStep + 1);
    updatedHistory.push(newItems);
    setHistory(updatedHistory);
    setHistoryStep(updatedHistory.length - 1);
    setCanvasItems(newItems);
  };

  const undo = () => {
    if (historyStep > 0) {
      const prev = historyStep - 1;
      setHistoryStep(prev);
      setCanvasItems(history[prev]);
      setSelectedId(null);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const next = historyStep + 1;
      setHistoryStep(next);
      setCanvasItems(history[next]);
      setSelectedId(null);
    }
  };

  const recalculateStage = useCallback((img?: HTMLImageElement | null) => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const maxH = Math.max(window.innerHeight - 230, 420);

    if (img) {
      const aspect = img.width / img.height;
      let w = containerW;
      let h = w / aspect;
      if (h > maxH) {
        h = maxH;
        w = h * aspect;
      }
      setStageSize({ width: Math.round(w), height: Math.round(h) });
    } else {
      const w = Math.min(containerW, 420);
      const h = Math.min(Math.round(w * (4 / 3)), maxH);
      setStageSize({ width: w, height: h });
    }
  }, []);

  useEffect(() => {
    const handleResize = () => recalculateStage(bgImage);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [bgImage, recalculateStage]);

  useEffect(() => {
    if (!initialStickerSlug) return;
    api.getSticker(initialStickerSlug)
      .then((st) => addStickerToCanvas(st))
      .catch(() => {});
  }, [initialStickerSlug]);

  useEffect(() => {
    if (!isPickerOpen) return;
    Promise.all([
      api.categories().catch(() => []),
      api.listStickers({ category: activeCategory || undefined, page_size: 40 }).catch(() => null),
    ]).then(([cats, res]) => {
      setCategories(cats);
      if (res) setPickerStickers(res.items);
    });
  }, [isPickerOpen, activeCategory]);

  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    if (selectedId) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`);
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
        trRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    trRef.current.nodes([]);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, canvasItems]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBgImage(img);
      recalculateStage(img);
      toast.success('Foto carregada!');
    };
    img.src = url;
  };

  const addStickerToCanvas = async (sticker: Sticker) => {
    try {
      const img = await loadImage(mediaUrl(sticker.image_url), true);
      const aspect = img.width / img.height;
      const targetW = Math.min(stageSize.width * 0.45, 220);
      const targetH = targetW / aspect;

      const newItem: CanvasItem = {
        id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'sticker',
        imageObj: img,
        x: (stageSize.width - targetW) / 2,
        y: (stageSize.height - targetH) / 2,
        width: targetW,
        height: targetH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      };

      pushHistory([...canvasItems, newItem]);
      setSelectedId(newItem.id);
      setIsPickerOpen(false);
      toast.success('Figurinha adicionada!');
    } catch {
      toast.error('Não foi possível carregar a figurinha.');
    }
  };

  const addTextToCanvas = () => {
    const text = prompt('Digite o texto para o seu story:', 'Bom dia ✦');
    if (!text) return;

    const newItem: CanvasItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      text,
      x: stageSize.width / 2 - 60,
      y: stageSize.height / 2 - 20,
      width: 140,
      height: 40,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fontSize: 28,
      fill: '#F2DEC9',
    };

    pushHistory([...canvasItems, newItem]);
    setSelectedId(newItem.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const filtered = canvasItems.filter((it) => it.id !== selectedId);
    pushHistory(filtered);
    setSelectedId(null);
  };

  const handleExport = async (format: 'png' | 'jpeg' = 'png') => {
    if (!stageRef.current) return;
    setSelectedId(null);

    setTimeout(() => {
      if (!stageRef.current) return;
      const dataUrl = stageRef.current.toDataURL({
        pixelRatio: bgImage ? Math.max(bgImage.width / stageSize.width, 1.5) : 2,
        mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
        quality: 0.95,
      });

      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          downloadBlob(blob, `story-${Date.now()}.${format}`);
          toast.success(`Story exportado em ${format.toUpperCase()}!`);
        })
        .catch(() => {
          toast.error('Erro ao exportar imagem.');
        });
    }, 50);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      {/* Editor Top Navigation */}
      <header className="flex items-center justify-between border-b border-[#DFB992]/15 bg-[#0D0B09]/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DFB992]/20 bg-[#1A1614] text-[#DFB992] transition hover:border-[#DFB992]"
            aria-label="Voltar"
          >
            <IconChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-wide text-[#F5EDE4]">
              Editor de Stories
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={historyStep <= 0}
            className="icon-btn border border-[#DFB992]/15 bg-[#151210] text-[#DFB992] hover:border-[#DFB992]/50 disabled:opacity-30"
            title="Desfazer"
          >
            <IconUndo size={17} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="icon-btn border border-[#DFB992]/15 bg-[#151210] text-[#DFB992] hover:border-[#DFB992]/50 disabled:opacity-30"
            title="Refazer"
          >
            <IconRedo size={17} />
          </button>
          <button
            type="button"
            onClick={() => handleExport('png')}
            className="btn-primary rounded-full px-4 py-2 text-xs"
          >
            <IconDownload size={16} />
            <span>Salvar Story</span>
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-4">
        <div
          ref={containerRef}
          className="relative flex items-center justify-center overflow-hidden rounded-3xl border border-[#DFB992]/30 bg-[#12100E] shadow-card"
          style={{ width: stageSize.width, height: stageSize.height }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          {!bgImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#DFB992]/30 bg-[#1A1614] text-[#DFB992] shadow-glow">
                <IconCamera size={28} />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#F5EDE4]">
                Escolha a foto do seu Story
              </h3>
              <p className="mt-1 max-w-xs text-xs text-[#9A8978]">
                Selecione uma foto da sua galeria e adicione nossas figurinhas por cima.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary mt-4 rounded-full px-5 py-2 text-xs"
              >
                Carregar Foto
              </button>
            </div>
          )}

          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
            onTouchStart={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
          >
            <Layer>
              {bgImage && (
                <KonvaImage
                  image={bgImage}
                  width={stageSize.width}
                  height={stageSize.height}
                />
              )}
            </Layer>

            <Layer>
              {canvasItems.map((item) => {
                if (item.type === 'sticker' && item.imageObj) {
                  return (
                    <KonvaImage
                      key={item.id}
                      id={item.id}
                      image={item.imageObj}
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      rotation={item.rotation}
                      scaleX={item.scaleX}
                      scaleY={item.scaleY}
                      draggable
                      onClick={() => setSelectedId(item.id)}
                      onTouchStart={() => setSelectedId(item.id)}
                      onDragEnd={(e) => {
                        const updated = canvasItems.map((it) =>
                          it.id === item.id ? { ...it, x: e.target.x(), y: e.target.y() } : it
                        );
                        pushHistory(updated);
                      }}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        const updated = canvasItems.map((it) =>
                          it.id === item.id
                            ? {
                                ...it,
                                x: node.x(),
                                y: node.y(),
                                rotation: node.rotation(),
                                scaleX: node.scaleX(),
                                scaleY: node.scaleY(),
                              }
                            : it
                        );
                        pushHistory(updated);
                      }}
                    />
                  );
                } else if (item.type === 'text') {
                  return (
                    <KonvaText
                      key={item.id}
                      id={item.id}
                      text={item.text}
                      x={item.x}
                      y={item.y}
                      fontSize={item.fontSize || 28}
                      fill={item.fill || '#F2DEC9'}
                      fontFamily="Cormorant Garamond, serif"
                      fontStyle="bold"
                      draggable
                      onClick={() => setSelectedId(item.id)}
                      onTouchStart={() => setSelectedId(item.id)}
                      onDragEnd={(e) => {
                        const updated = canvasItems.map((it) =>
                          it.id === item.id ? { ...it, x: e.target.x(), y: e.target.y() } : it
                        );
                        pushHistory(updated);
                      }}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        const updated = canvasItems.map((it) =>
                          it.id === item.id
                            ? {
                                ...it,
                                x: node.x(),
                                y: node.y(),
                                rotation: node.rotation(),
                                scaleX: node.scaleX(),
                                scaleY: node.scaleY(),
                              }
                            : it
                        );
                        pushHistory(updated);
                      }}
                    />
                  );
                }
                return null;
              })}

              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 10 || newBox.height < 10) return oldBox;
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>

        {/* Selected element quick controls */}
        {selectedId && (
          <div className="mt-4 flex items-center gap-3 rounded-full border border-[#DFB992]/25 bg-[#151210]/95 px-4 py-1.5 shadow-glow backdrop-blur">
            <span className="text-xs text-[#C8B6A6]">Item selecionado</span>
            <button
              type="button"
              onClick={deleteSelected}
              className="btn-danger min-h-[30px] rounded-full px-3 py-1 text-xs"
            >
              <IconTrash size={14} />
              <span>Remover</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <nav className="flex items-center justify-around border-t border-[#DFB992]/15 bg-[#0C0A09]/95 px-4 py-3 sm:justify-center sm:gap-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-xs text-[#C8B6A6] transition hover:text-[#DFB992]"
        >
          <IconCamera size={20} />
          <span>{bgImage ? 'Trocar Foto' : 'Carregar Foto'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="flex flex-col items-center gap-1 text-xs font-semibold text-[#DFB992] transition hover:text-[#F2DEC9]"
        >
          <IconPlus size={20} />
          <span>Adicionar Figurinha</span>
        </button>

        <button
          type="button"
          onClick={addTextToCanvas}
          className="flex flex-col items-center gap-1 text-xs text-[#C8B6A6] transition hover:text-[#DFB992]"
        >
          <IconText size={20} />
          <span>Adicionar Texto</span>
        </button>
      </nav>

      {/* Stickers Drawer / Bottom Sheet Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm">
          <div className="flex max-h-[80vh] flex-col rounded-t-3xl border-t border-[#DFB992]/30 bg-[#12100E] p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DFB992]/15 pb-3">
              <h3 className="font-serif text-base font-bold text-[#F5EDE4]">
                Escolha uma Figurinha
              </h3>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="icon-btn text-[#9A8978] hover:text-[#DFB992]"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Category tabs */}
            <div className="no-scrollbar flex gap-2 overflow-x-auto py-2.5">
              <button
                type="button"
                onClick={() => setActiveCategory('')}
                className={!activeCategory ? 'chip-active' : 'chip-inactive'}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.slug)}
                  className={activeCategory === c.slug ? 'chip-active' : 'chip-inactive'}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Sticker grid inside picker */}
            <div className="grid flex-1 grid-cols-3 gap-2.5 overflow-y-auto py-3 sm:grid-cols-5 md:grid-cols-6">
              {pickerStickers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addStickerToCanvas(s)}
                  className="aspect-[3/4] overflow-hidden rounded-2xl border border-[#DFB992]/25 bg-[#C2A385] p-2.5 transition hover:scale-105 hover:border-[#DFB992]"
                >
                  <img
                    src={mediaUrl(s.thumbnail_url)}
                    alt={s.name}
                    className="h-full w-full object-contain drop-shadow"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
