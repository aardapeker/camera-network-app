import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FileDown, Loader2 } from "lucide-react";
import L from "leaflet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { loadSvgAsImage, deviceSvgIcons, cameraSubtypeSvgIcons } from "~/hooks/use-pdf-export";
import { DeviceType } from "./icons";
import { getSessionToken } from "~/functions/get_session_token";
import type { PdfExportOptions } from "~/hooks/use-pdf-export";
import type { ViewerDevice } from "~/types/topology";

interface PdfExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: PdfExportOptions) => void;
  isExporting: boolean;
  blueprintUrl: string | null;
  imageBounds: L.LatLngBoundsExpression;
  devices: ViewerDevice[];
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function BlueprintPreview({
  multiplier,
  textMultiplier,
  gapMultiplier,
  preloadedImg,
  preloadState,
  imageBounds,
  devices,
}: {
  multiplier: number;
  textMultiplier: number;
  gapMultiplier: number;
  preloadedImg: HTMLImageElement | null;
  preloadState: "loading" | "ready" | "error";
  imageBounds: L.LatLngBoundsExpression;
  devices: ViewerDevice[];
}) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blueprintImgRef = useRef<HTMLImageElement | null>(null);
  const cropCenterRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startCropX: number; startCropY: number } | null>(null);
  const drawGenRef = useRef<number>(0);
  const drawRef = useRef<(() => void) | null>(null);
  // Preview-only zoom: 1 = 1:1 PDF pixels, <1 = zoomed out (wider crop)
  const [viewZoom, setViewZoom] = useState(1);
  const viewZoomRef = useRef(1);

  const changeZoom = useCallback((delta: number) => {
    const steps = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
    const current = viewZoomRef.current;
    const idx = steps.findIndex((s) => s >= current);
    const newIdx = Math.max(0, Math.min(steps.length - 1, idx + delta));
    const next = steps[newIdx];
    viewZoomRef.current = next;
    setViewZoom(next);
    // draw() is async and captured in a closure — call via ref to get latest version
    drawRef.current?.();
  }, []);

  // Sync preloaded image into ref; reset crop on new image
  useEffect(() => {
    if (preloadState === "ready" && preloadedImg) {
      blueprintImgRef.current = preloadedImg;
      cropCenterRef.current = null;
    }
  }, [preloadedImg, preloadState]);

  const draw = useCallback(async () => {
    const gen = ++drawGenRef.current;
    const canvas = canvasRef.current;
    const bpImg = blueprintImgRef.current;
    if (!canvas || !bpImg) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const bounds = imageBounds as [[number, number], [number, number]];
    const toCanvas = (lat: number, lng: number): [number, number] => {
      const x = (lng / bounds[1][1]) * bpImg.width;
      const y = bpImg.height - (lat / bounds[1][0]) * bpImg.height;
      return [x, y];
    };

    // On first draw, center on median device; afterwards use dragged position
    if (!cropCenterRef.current) {
      const visible = devices.filter((d) => d.lat != null && d.lng != null);
      let cx = bpImg.width / 2;
      let cy = bpImg.height / 2;
      if (visible.length > 0) {
        const sorted = [...visible].sort((a, b) => a.lng - b.lng);
        const mid = sorted[Math.floor(sorted.length / 2)];
        [cx, cy] = toCanvas(mid.lat, mid.lng);
      }
      cropCenterRef.current = { x: cx, y: cy };
    }

    // PDF export pipeline — same as use-pdf-export.tsx
    const MAX_CANVAS_DIMENSION = 4096;
    let exportScale = 2;
    if (bpImg.width * exportScale > MAX_CANVAS_DIMENSION || bpImg.height * exportScale > MAX_CANVAS_DIMENSION) {
      exportScale = Math.min(MAX_CANVAS_DIMENSION / bpImg.width, MAX_CANVAS_DIMENSION / bpImg.height);
    }
    const uiScale = 2 / exportScale;
    const exportCanvasW = bpImg.width * exportScale;
    const exportCanvasH = bpImg.height * exportScale;

    // jsPDF A4 landscape layout
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;
    const headerHeight = 25;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (exportCanvasH / exportCanvasW) * imgWidth;
    const maxImgHeight = pageHeight - margin - headerHeight - margin;
    const finalImgWidth = imgHeight > maxImgHeight
      ? (exportCanvasW / exportCanvasH) * maxImgHeight
      : imgWidth;
    const pxToMm = finalImgWidth / exportCanvasW;
    const iconSizeMm = 12 * uiScale * multiplier * pxToMm;

    // viewZoom < 1 = zoomed out (wider crop, icons appear smaller)
    const vz = viewZoomRef.current;
    const cropW = (W / exportScale) / vz;
    const cropH = (H / exportScale) / vz;
    const { x: cropCX, y: cropCY } = cropCenterRef.current;
    const srcX = Math.max(0, Math.min(cropCX - cropW / 2, bpImg.width - cropW));
    const srcY = Math.max(0, Math.min(cropCY - cropH / 2, bpImg.height - cropH));

    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(bpImg, srcX, srcY, cropW, cropH, 0, 0, W, H);

    const scaleX = W / cropW;
    const scaleY = H / cropH;

    // Icons scale with viewZoom so they look correct relative to the blueprint
    const iconSize = Math.max(2, Math.round(12 * uiScale * multiplier * vz));
    const fontSize = Math.max(2, 5 * uiScale * textMultiplier * vz);
    const distance = Math.round(18 * gapMultiplier * vz);
    const lineLength = distance;
    const padding = 2;

    const iconCache = new Map<string, HTMLImageElement>();
    const visible = devices.filter((d) => d.lat != null && d.lng != null);

    for (const device of visible) {
      const [srcPx, srcPy] = toCanvas(device.lat, device.lng);
      const px = (srcPx - srcX) * scaleX;
      const py = (srcPy - srcY) * scaleY;

      if (px < -iconSize || px > W + iconSize || py < -iconSize || py > H + iconSize) continue;

      const color = device.color && HEX_COLOR_REGEX.test(device.color) ? device.color : "#000000";
      const cacheKey = `${device.type}-${device.subtype || ""}-${color}`;

      let img = iconCache.get(cacheKey);
      if (!img) {
        const svgString =
          device.type === DeviceType.CAMERA && device.subtype && cameraSubtypeSvgIcons[device.subtype]
            ? cameraSubtypeSvgIcons[device.subtype]
            : deviceSvgIcons[device.type];
        try {
          img = await loadSvgAsImage(svgString, iconSize, color);
          if (gen !== drawGenRef.current) return;
          iconCache.set(cacheKey, img);
        } catch { continue; }
      }

      ctx.drawImage(img, px - iconSize / 2, py - iconSize / 2, iconSize, iconSize);

      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py + iconSize / 2);
      ctx.lineTo(px, py + iconSize / 2 + lineLength);
      ctx.stroke();

      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const labelText = device.label.substring(0, 12);
      const textWidth = ctx.measureText(labelText).width;
      const bgX = px - textWidth / 2 - padding;
      const bgY = py + iconSize / 2 + distance;
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(bgX, bgY, textWidth + padding * 2, fontSize + padding);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(labelText, px, bgY);
    }

    // Size indicator + drag hint
    ctx.font = "10px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`≈ ${iconSizeMm.toFixed(1)}mm on A4  ·  ${vz < 1 ? vz.toFixed(2) : vz}x view  · drag to pan`, 6, 5);
  }, [multiplier, textMultiplier, gapMultiplier, viewZoom, imageBounds, devices]);

  useEffect(() => { drawRef.current = draw; }, [draw]);

  useEffect(() => {
    if (preloadState === "ready") draw();
  }, [preloadState, draw]);

  // Drag handlers — update cropCenter in source image coords and redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getExportScale = () => {
      const bpImg = blueprintImgRef.current;
      if (!bpImg) return 2;
      const MAX = 4096;
      let s = 2;
      if (bpImg.width * s > MAX || bpImg.height * s > MAX) {
        s = Math.min(MAX / bpImg.width, MAX / bpImg.height);
      }
      return s;
    };

    // Source pixels per canvas pixel — accounts for view zoom
    const srcPerPx = () => {
      const bpImg = blueprintImgRef.current;
      if (!bpImg) return 1;
      return 1 / (getExportScale() * viewZoomRef.current);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!cropCenterRef.current) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startCropX: cropCenterRef.current.x,
        startCropY: cropCenterRef.current.y,
      };
      canvas.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !blueprintImgRef.current) return;
      const spx = srcPerPx();
      const dx = (e.clientX - dragRef.current.startX) * spx;
      const dy = (e.clientY - dragRef.current.startY) * spx;
      const bpImg = blueprintImgRef.current;
      cropCenterRef.current = {
        x: Math.max(0, Math.min(dragRef.current.startCropX - dx, bpImg.width)),
        y: Math.max(0, Math.min(dragRef.current.startCropY - dy, bpImg.height)),
      };
      draw();
    };

    const onMouseUp = () => {
      dragRef.current = null;
      canvas.style.cursor = "grab";
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!cropCenterRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      dragRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        startCropX: cropCenterRef.current.x,
        startCropY: cropCenterRef.current.y,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length !== 1 || !dragRef.current || !blueprintImgRef.current) return;
      const t = e.touches[0];
      const spx = srcPerPx();
      const dx = (t.clientX - dragRef.current.startX) * spx;
      const dy = (t.clientY - dragRef.current.startY) * spx;
      const bpImg = blueprintImgRef.current;
      cropCenterRef.current = {
        x: Math.max(0, Math.min(dragRef.current.startCropX - dx, bpImg.width)),
        y: Math.max(0, Math.min(dragRef.current.startCropY - dy, bpImg.height)),
      };
      draw();
    };

    const onTouchEnd = () => { dragRef.current = null; };

    canvas.style.cursor = "grab";
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [draw]);

  const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
  const currentIdx = ZOOM_STEPS.findIndex((s) => s >= viewZoom);
  const canZoomIn = currentIdx < ZOOM_STEPS.length - 1;
  const canZoomOut = currentIdx > 0;

  return (
    <div className="relative w-full rounded-md overflow-hidden border border-border bg-muted" style={{ height: 130 }}>
      <canvas ref={canvasRef} width={300} height={130} className="w-full h-full" />
      {preloadState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {preloadState === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">{t("pdfExport.previewUnavailable")}</span>
        </div>
      )}
      {preloadState === "ready" && (
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
          <button
            onClick={() => changeZoom(-1)}
            disabled={!canZoomOut}
            className="w-6 h-6 flex items-center justify-center rounded bg-black/50 text-white text-sm leading-none disabled:opacity-30 hover:bg-black/70"
          >−</button>
          <span className="text-white text-xs tabular-nums bg-black/50 px-1 rounded">{viewZoom}x</span>
          <button
            onClick={() => changeZoom(1)}
            disabled={!canZoomIn}
            className="w-6 h-6 flex items-center justify-center rounded bg-black/50 text-white text-sm leading-none disabled:opacity-30 hover:bg-black/70"
          >+</button>
        </div>
      )}
    </div>
  );
}

export function PdfExportDialog({
  open,
  onOpenChange,
  onExport,
  isExporting,
  blueprintUrl,
  imageBounds,
  devices,
}: PdfExportDialogProps) {
  const { t } = useTranslation();
  const [showLabels, setShowLabels] = useState(true);
  const [iconSizeMultiplier, setIconSizeMultiplier] = useState(1);
  const [textSizeMultiplier, setTextSizeMultiplier] = useState(1);
  const [labelGapMultiplier, setLabelGapMultiplier] = useState(1);
  const [includeInfoPages, setIncludeInfoPages] = useState(true);
  const preloadedImgRef = useRef<HTMLImageElement | null>(null);
  const [preloadState, setPreloadState] = useState<"loading" | "ready" | "error">("loading");

  // Preload blueprint image eagerly so the dialog opens instantly
  useEffect(() => {
    if (!blueprintUrl) { setPreloadState("error"); return; }
    preloadedImgRef.current = null;
    setPreloadState("loading");
    const token = getSessionToken();
    let cancelled = false;
    fetch(`/files/proxy-blueprint?url=${encodeURIComponent(blueprintUrl)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          if (!cancelled) { preloadedImgRef.current = img; setPreloadState("ready"); }
        };
        img.onerror = () => { URL.revokeObjectURL(url); if (!cancelled) setPreloadState("error"); };
        img.src = url;
      })
      .catch(() => { if (!cancelled) setPreloadState("error"); });
    return () => { cancelled = true; };
  }, [blueprintUrl]);

  const handleExport = () => {
    onExport({ showLabels, iconSizeMultiplier, textSizeMultiplier, labelGapMultiplier, includeInfoPages });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle>{t("pdfExport.title")}</DialogTitle>
          <DialogDescription>
            {t("pdfExport.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-labels">{t("pdfExport.showDeviceNames")}</Label>
            <Switch
              id="show-labels"
              checked={showLabels}
              onCheckedChange={setShowLabels}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="include-info-pages">{t("pdfExport.includeInfoPages")}</Label>
            <Switch
              id="include-info-pages"
              checked={includeInfoPages}
              onCheckedChange={setIncludeInfoPages}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>{t("pdfExport.iconSize")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {iconSizeMultiplier.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.25}
              max={5}
              step={0.05}
              value={iconSizeMultiplier}
              onChange={(e) => setIconSizeMultiplier(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.25x</span>
              <span>1x</span>
              <span>2.5x</span>
              <span>5x</span>
            </div>
          </div>
          {showLabels && (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t("pdfExport.textSize")}</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {textSizeMultiplier.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.25}
                  max={4}
                  step={0.05}
                  value={textSizeMultiplier}
                  onChange={(e) => setTextSizeMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.25x</span>
                  <span>1.5x</span>
                  <span>2.75x</span>
                  <span>4x</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t("pdfExport.labelGap")}</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {labelGapMultiplier.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.05}
                  value={labelGapMultiplier}
                  onChange={(e) => setLabelGapMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0x</span>
                  <span>1x</span>
                  <span>2.5x</span>
                  <span>5x</span>
                </div>
              </div>
            </>
          )}
          <div className="flex flex-col gap-2">
            {open && (
              <BlueprintPreview
                multiplier={iconSizeMultiplier}
                textMultiplier={textSizeMultiplier}
                gapMultiplier={labelGapMultiplier}
                preloadedImg={preloadedImgRef.current}
                preloadState={preloadState}
                imageBounds={imageBounds}
                devices={devices}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {isExporting ? t("pdfExport.exporting") : t("pdfExport.export")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
