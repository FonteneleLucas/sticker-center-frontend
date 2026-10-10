import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useDocumentMeta } from '../lib/seo';
import { useToast } from '../components/Toast';
import { downloadBlob, loadImage } from '../lib/image';
import {
  IconCamera,
  IconDownload,
  IconSparkles,
  IconBrush,
  IconEraser,
  IconUndo,
  IconRedo,
} from '../components/Icons';

export function CreateStickerPage() {
  useDocumentMeta('Criar Sticker Personalizado', 'Crie seu próprio sticker com remoção de fundo e contorno branco die-cut.');
  const toast = useToast();

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

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
        setModelLoaded(true);
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
    toast.info('Segmentando primeiro plano da imagem...');

    try {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      // Offscreen canvas for mask
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = w;
      maskCanvas.height = h;
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })!;
      maskCanvasRef.current = maskCanvas;

      if (segmenterRef.current) {
        // Run MediaPipe segmentation
        const result = segmenterRef.current.segment(img);
        const categoryMask = result.categoryMask;
        if (categoryMask) {
          const maskArray = categoryMask.getAsUint8Array();
          const imgData = maskCtx.createImageData(w, h);
          for (let i = 0; i < maskArray.length; i++) {
            // Mask: 0 = background, foreground > 0
            const isFg = maskArray[i] > 0;
            imgData.data[i * 4 + 0] = isFg ? 255 : 0;
            imgData.data[i * 4 + 1] = isFg ? 255 : 0;
            imgData.data[i * 4 + 2] = isFg ? 255 : 0;
            imgData.data[i * 4 + 3] = isFg ? 255 : 0;
          }
          maskCtx.putImageData(imgData, 0, 0);
        }
      } else {
        // High quality fallback: Color distance & edge grabcut heuristic
        const tempC = document.createElement('canvas');
        tempC.width = w;
        tempC.height = h;
        const tempCtx = tempC.getContext('2d')!;
        tempCtx.drawImage(img, 0, 0);
        const imgData = tempCtx.getImageData(0, 0, w, h);
        const maskData = maskCtx.createImageData(w, h);

        // Sample 4 corner colors
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

          // Check distance to corners
          let minDiff = 999;
          for (const [br, bg, bb] of bgSamples) {
            const diff = Math.hypot(r - br, g - bg, b - bb);
            if (diff < minDiff) minDiff = diff;
          }

          // If different from corner sample, treat as foreground
          const isFg = minDiff > 35;
          maskData.data[i] = isFg ? 255 : 0;
          maskData.data[i + 1] = isFg ? 255 : 0;
          maskData.data[i + 2] = isFg ? 255 : 0;
          maskData.data[i + 3] = isFg ? 255 : 0;
        }
        maskCtx.putImageData(maskData, 0, 0);
      }

      // Save initial state in history
      const initialMask = maskCtx.getImageData(0, 0, w, h);
      historyRef.current = [initialMask];
      historyIndexRef.current = 0;

      renderFinalSticker();
      toast.success('Fundo removido!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro na segmentação. Você pode usar a ferramenta manual.');
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

    // Give margin for sticker die-cut white border
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

      // Draw silhouette repeatedly in radius circle to generate thick outline
      const radius = borderWidth;
      const steps = 36;
      for (let i = 0; i < steps; i++) {
        const angle = (i * 2 * Math.PI) / steps;
        const ox = padding + Math.cos(angle) * radius;
        const oy = padding + Math.sin(angle) * radius;
        oCtx.drawImage(maskCanvas, ox, oy);
      }
      // Fill silhouette with pure white
      oCtx.globalCompositeOperation = 'source-in';
      oCtx.fillStyle = '#ffffff';
      oCtx.fillRect(0, 0, outlineCanvas.width, outlineCanvas.height);

      // Draw subtle drop shadow under outline
      if (addShadow) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
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

  // Touch & Pointer interaction for manual Retouch Brush
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
    // Save to retouch history
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

    // Coordinates on original mask
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
        downloadBlob(blob, `meu-sticker-${Date.now()}.png`);
        toast.success('Sticker transparente baixado com sucesso!');
      }
    }, 'image/png');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">Criar Sticker Personalizado</h1>
          <p className="mt-1 text-sm text-slate-500">
            Envie uma foto, remova o fundo automaticamente e aplique um contorno de adesivo em PNG transparente.
          </p>
        </div>

        {!rawImageSrc ? (
          /* Empty state: upload box */
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mb-4 rounded-full bg-brand-50 p-5 text-brand-600">
              <IconSparkles size={40} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Selecione uma imagem</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Escolha uma foto da sua galeria, animal de estimação ou objeto com bom contraste.
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
              className="btn-primary mt-6 text-base shadow-sm"
            >
              <IconCamera size={20} />
              <span>Escolher da Galeria</span>
            </button>
          </div>
        ) : (
          /* Editor and preview workspace */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Canvas Preview Area */}
            <div className="flex flex-col items-center lg:col-span-7">
              <div className="checkerboard relative flex min-h-[380px] w-full max-w-[500px] items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
                    <span className="mt-3 text-sm font-semibold text-slate-700">Removendo o fundo...</span>
                  </div>
                )}
              </div>

              {/* Retouch Tool Selection */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTool('none')}
                  className={`btn text-xs ${tool === 'none' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Visualizar
                </button>
                <button
                  type="button"
                  onClick={() => setTool('erase')}
                  className={`btn text-xs ${tool === 'erase' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <IconEraser size={16} />
                  <span>Apagar detalhes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTool('restore')}
                  className={`btn text-xs ${tool === 'restore' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <IconBrush size={16} />
                  <span>Restaurar</span>
                </button>
              </div>
            </div>

            {/* Customization Controls Sidebar */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800">Efeitos do Adesivo</h3>

                <div className="mt-4 space-y-4">
                  {/* Border toggle */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Contorno branco die-cut</span>
                    <input
                      type="checkbox"
                      checked={addBorder}
                      onChange={(e) => setAddBorder(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </label>

                  {addBorder && (
                    <div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Espessura da borda</span>
                        <span>{borderWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="32"
                        value={borderWidth}
                        onChange={(e) => setBorderWidth(Number(e.target.value))}
                        className="mt-1 w-full"
                      />
                    </div>
                  )}

                  {/* Shadow toggle */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Sombra suave</span>
                    <input
                      type="checkbox"
                      checked={addShadow}
                      onChange={(e) => setAddShadow(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </label>

                  {tool !== 'none' && (
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Tamanho do pincel</span>
                        <span>{brushSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="60"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="mt-1 w-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn-primary min-h-[48px] text-base shadow-sm"
                >
                  <IconDownload size={20} />
                  <span>Baixar como PNG Transparente</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRawImageSrc(null);
                    originalImgRef.current = null;
                  }}
                  className="btn-secondary min-h-[42px] text-xs"
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
