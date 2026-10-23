import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useDocumentMeta } from '../lib/seo';
import { useToast } from '../components/Toast';
import { downloadBlob } from '../lib/image';
import {
  IconCamera,
  IconDownload,
  IconSparkles,
  IconBrush,
  IconEraser,
} from '../components/Icons';

export function CreateStickerPage() {
  useDocumentMeta(
    'Criar Figurinha Personalizada — Stories & Stickers',
    'Crie sua própria figurinha com remoção de fundo e contorno para seus stories.'
  );
  const toast = useToast();

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sticker customization options
  const [addBorder, setAddBorder] = useState(true);
  const [borderWidth, setBorderWidth] = useState(16);
  const [addShadow, setAddShadow] = useState(true);

  // Manual brush touchup tool ('erase' | 'restore' | 'none')
  const [tool, setTool] = useState<'none' | 'erase' | 'restore'>('none');
  const [brushSize, setBrushSize] = useState(25);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const isPaintingRef = useRef(false);

  // History for manual retouch
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);

  // Load MediaPipe ImageSegmenter if available or fallback
  const segmenterRef = useRef<any>(null);

  useEffect(() => {
    async function loadSegmenter() {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const wasmFileset = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        segmenterRef.current = await vision.ImageSegmenter.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
      } catch (err) {
        console.warn('MediaPipe offline or failed to load delegate, fallback segmentation will be used.', err);
      }
    }
    loadSegmenter();
  }, []);

  // Handle Image Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      originalImgRef.current = img;
      setRawImageSrc(url);
      runSegmentation(img);
    };
    img.src = url;
  };

  // Perform AI segmentation or intelligent edge contrast fallback
  const runSegmentation = async (img: HTMLImageElement) => {
    setIsProcessing(true);
    toast.info('Removendo fundo da imagem...');

    try {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = w;
      maskCanvas.height = h;
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
      maskCanvasRef.current = maskCanvas;

      if (segmenterRef.current) {
        const result = segmenterRef.current.segment(img);
        const categoryMask = result.categoryMask;
        if (categoryMask) {
          const maskArray = categoryMask.getAsUint8Array();
          const imgData = maskCtx.createImageData(w, h);
          for (let i = 0; i < maskArray.length; i++) {
            const isFg = maskArray[i] > 0;
            imgData.data[i * 4 + 0] = isFg ? 255 : 0;
            imgData.data[i * 4 + 1] = isFg ? 255 : 0;
            imgData.data[i * 4 + 2] = isFg ? 255 : 0;
            imgData.data[i * 4 + 3] = isFg ? 255 : 0;
          }
          maskCtx.putImageData(imgData, 0, 0);
        }
      } else {
        const tempC = document.createElement('canvas');
        tempC.width = w;
        tempC.height = h;
        const tempCtx = tempC.getContext('2d')!;
        tempCtx.drawImage(img, 0, 0);
        const imgData = tempCtx.getImageData(0, 0, w, h);
        const maskData = maskCtx.createImageData(w, h);

        const getPixel = (x: number, y: number) => {
          const idx = (y * w + x) * 4;
          return [imgData.data[idx], imgData.data[idx + 1], imgData.data[idx + 2]];
        };
        const bgSamples = [
          getPixel(0, 0),
          getPixel(w - 1, 0),
          getPixel(0, h - 1),
          getPixel(w - 1, h - 1),
        ];

        for (let i = 0; i < imgData.data.length; i += 4) {
          const r = imgData.data[i];
          const g = imgData.data[i + 1];
          const b = imgData.data[i + 2];

          let minDiff = 999;
          for (const [br, bg, bb] of bgSamples) {
            const diff = Math.hypot(r - br, g - bg, b - bb);
            if (diff < minDiff) minDiff = diff;
          }

          const isFg = minDiff > 35;
          maskData.data[i] = isFg ? 255 : 0;
          maskData.data[i + 1] = isFg ? 255 : 0;
          maskData.data[i + 2] = isFg ? 255 : 0;
          maskData.data[i + 3] = isFg ? 255 : 0;
        }
        maskCtx.putImageData(maskData, 0, 0);
      }

      const initialMask = maskCtx.getImageData(0, 0, w, h);
      historyRef.current = [initialMask];
      historyIndexRef.current = 0;

      renderFinalSticker();
      toast.success('Fundo removido com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro na segmentação. Você pode usar o pincel manual.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render combined sticker to target canvas
  const renderFinalSticker = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const img = originalImgRef.current;
    if (!canvas || !maskCanvas || !img) return;

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const padding = addBorder ? borderWidth * 2 + 20 : 10;
    canvas.width = w + padding * 2;
    canvas.height = h + padding * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Cutout Foreground
    const cutoutCanvas = document.createElement('canvas');
    cutoutCanvas.width = w;
    cutoutCanvas.height = h;
    const cutCtx = cutoutCanvas.getContext('2d')!;
    cutCtx.drawImage(img, 0, 0);
    cutCtx.globalCompositeOperation = 'destination-in';
    cutCtx.drawImage(maskCanvas, 0, 0);

    // 2. White die-cut outline and shadow if requested
    if (addBorder) {
      const outlineCanvas = document.createElement('canvas');
      outlineCanvas.width = canvas.width;
      outlineCanvas.height = canvas.height;
      const oCtx = outlineCanvas.getContext('2d')!;

      const radius = borderWidth;
      const steps = 36;
      for (let i = 0; i < steps; i++) {
        const angle = (i * 2 * Math.PI) / steps;
        const ox = padding + Math.cos(angle) * radius;
        const oy = padding + Math.sin(angle) * radius;
        oCtx.drawImage(maskCanvas, ox, oy);
      }
      oCtx.globalCompositeOperation = 'source-in';
      oCtx.fillStyle = '#ffffff';
      oCtx.fillRect(0, 0, outlineCanvas.width, outlineCanvas.height);

      if (addShadow) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.drawImage(outlineCanvas, 0, 0);
        ctx.restore();
      }

      ctx.drawImage(outlineCanvas, 0, 0);
    }

    // 3. Draw Cutout image on top
    ctx.drawImage(cutoutCanvas, padding, padding);
  }, [addBorder, borderWidth, addShadow]);

  useEffect(() => {
    renderFinalSticker();
  }, [renderFinalSticker]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'none' || !maskCanvasRef.current) return;
    isPaintingRef.current = true;
    applyBrush(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current || tool === 'none') return;
    applyBrush(e);
  };

  const handlePointerUp = () => {
    if (!isPaintingRef.current) return;
    isPaintingRef.current = false;
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d')!;
      const state = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      const newHist = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHist.push(state);
      historyRef.current = newHist;
      historyIndexRef.current = newHist.length - 1;
    }
  };

  const applyBrush = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!canvas || !mask) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const padding = addBorder ? borderWidth * 2 + 20 : 10;
    const canvasX = (e.clientX - rect.x) * scaleX;
    const canvasY = (e.clientY - rect.y) * scaleY;

    const maskX = canvasX - padding;
    const maskY = canvasY - padding;

    const ctx = mask.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(maskX, maskY, brushSize, 0, Math.PI * 2);

    if (tool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
    } else if (tool === 'restore') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    renderFinalSticker();
  };

  const handleDownload = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `figurinha-${Date.now()}.png`);
        toast.success('Figurinha transparente baixada!');
      }
    }, 'image/png');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090807] text-[#F5EDE4]">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-[#F5EDE4]">
            Criar Figurinha Personalizada
          </h1>
          <p className="mt-1 text-xs text-[#9A8978] sm:text-sm">
            Envie uma foto, remova o fundo automaticamente e gere sua figurinha em PNG transparente.
          </p>
        </div>

        {!rawImageSrc ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#DFB992]/35 bg-[#12100E] p-12 text-center shadow-card">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#DFB992]/30 bg-[#1B1714] text-[#DFB992] shadow-glow">
              <IconSparkles size={32} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#F5EDE4]">Selecione uma imagem</h2>
            <p className="mt-2 max-w-sm text-xs text-[#9A8978] sm:text-sm">
              Escolha uma foto da sua galeria, pet, produto ou logotipo para transformar em figurinha.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary mt-6 rounded-full px-7 text-sm"
            >
              <IconCamera size={18} />
              <span>Escolher da Galeria</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Canvas Preview Area */}
            <div className="flex flex-col items-center lg:col-span-7">
              <div className="checkerboard relative flex min-h-[380px] w-full max-w-[500px] items-center justify-center overflow-hidden rounded-3xl border border-[#DFB992]/25 p-4 shadow-card">
                <canvas
                  ref={previewCanvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className={`max-h-[460px] w-auto max-w-full object-contain ${
                    tool !== 'none' ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090807]/85 backdrop-blur-sm">
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#DFB992]/25 border-t-[#DFB992]" />
                    <span className="mt-3 text-xs font-semibold text-[#DFB992]">
                      Removendo o fundo...
                    </span>
                  </div>
                )}
              </div>

              {/* Retouch Tool Selection */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTool('none')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    tool === 'none' ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  Visualizar
                </button>
                <button
                  type="button"
                  onClick={() => setTool('erase')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    tool === 'erase' ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  <IconEraser size={15} />
                  <span>Apagar detalhes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTool('restore')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    tool === 'restore' ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  <IconBrush size={15} />
                  <span>Restaurar</span>
                </button>
              </div>
            </div>

            {/* Customization Controls Sidebar */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              <div className="rounded-3xl border border-[#DFB992]/20 bg-[#141210] p-6 shadow-card">
                <h3 className="font-serif text-lg font-bold text-[#F5EDE4]">
                  Acabamento da Figurinha
                </h3>

                <div className="mt-4 space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#E6D5C3]">Contorno branco</span>
                    <input
                      type="checkbox"
                      checked={addBorder}
                      onChange={(e) => setAddBorder(e.target.checked)}
                      className="h-4 w-4 rounded border-[#DFB992]/40 bg-[#1C1815] text-[#DFB992] focus:ring-[#DFB992]"
                    />
                  </label>

                  {addBorder && (
                    <div>
                      <div className="flex justify-between text-xs text-[#9A8978]">
                        <span>Espessura da borda</span>
                        <span className="text-[#DFB992]">{borderWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="32"
                        value={borderWidth}
                        onChange={(e) => setBorderWidth(Number(e.target.value))}
                        className="mt-1 w-full accent-[#DFB992]"
                      />
                    </div>
                  )}

                  <label className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#E6D5C3]">Sombra suave</span>
                    <input
                      type="checkbox"
                      checked={addShadow}
                      onChange={(e) => setAddShadow(e.target.checked)}
                      className="h-4 w-4 rounded border-[#DFB992]/40 bg-[#1C1815] text-[#DFB992] focus:ring-[#DFB992]"
                    />
                  </label>

                  {tool !== 'none' && (
                    <div className="border-t border-[#DFB992]/15 pt-4">
                      <div className="flex justify-between text-xs text-[#9A8978]">
                        <span>Tamanho do pincel</span>
                        <span className="text-[#DFB992]">{brushSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="60"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="mt-1 w-full accent-[#DFB992]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn-primary min-h-[48px] rounded-2xl text-sm"
                >
                  <IconDownload size={18} />
                  <span>Baixar PNG Transparente</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRawImageSrc(null);
                    originalImgRef.current = null;
                  }}
                  className="btn-secondary min-h-[42px] rounded-2xl text-xs"
                >
                  Escolher outra foto
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
