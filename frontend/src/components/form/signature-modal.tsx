import React from "react"
import SignaturePad from "signature_pad"
import { useTranslation } from "react-i18next"
import { RotateCcw, Check, X } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog"

interface SignatureModalProps {
  open: boolean
  title: string
  onSave: (dataUrl: string) => void
  onClose: () => void
}

export function SignatureModal({ open, title, onSave, onClose }: SignatureModalProps) {
  const { t } = useTranslation()
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const padRef = React.useRef<SignaturePad | null>(null)
  const [hasStrokes, setHasStrokes] = React.useState(false)

  const initPad = React.useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext("2d")!
    ctx.scale(dpr, dpr)

    if (padRef.current) {
      padRef.current.off()
    }

    padRef.current = new SignaturePad(canvas, {
      minWidth: 0.8,
      maxWidth: 2.5,
      penColor: "#000000",
      backgroundColor: "rgba(0,0,0,0)",
    })

    padRef.current.addEventListener("beginStroke", () => setHasStrokes(true))
  }, [])

  // Init after dialog animation completes
  React.useEffect(() => {
    if (!open) {
      padRef.current?.off()
      return
    }

    setHasStrokes(false)
    const timer = setTimeout(initPad, 80)
    return () => clearTimeout(timer)
  }, [open, initPad])

  // Re-init on window resize
  React.useEffect(() => {
    if (!open) return
    const observer = new ResizeObserver(() => {
      // Preserve strokes across resize
      const data = padRef.current?.toData()
      initPad()
      if (data && data.length > 0) {
        padRef.current?.fromData(data)
        setHasStrokes(true)
      }
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [open, initPad])

  function clear() {
    padRef.current?.clear()
    setHasStrokes(false)
  }

  function save() {
    if (!padRef.current || padRef.current.isEmpty()) return
    onSave(trimmedDataUrl())
    onClose()
  }

  function trimmedDataUrl(): string {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const dpr = window.devicePixelRatio || 1
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)

    let minX = width, minY = height, maxX = 0, maxY = 0

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3]
        if (alpha > 0) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    const pad = 12 * dpr
    minX = Math.max(0, minX - pad)
    minY = Math.max(0, minY - pad)
    maxX = Math.min(width, maxX + pad)
    maxY = Math.min(height, maxY + pad)

    const trimW = maxX - minX
    const trimH = maxY - minY

    const offscreen = document.createElement("canvas")
    offscreen.width = trimW
    offscreen.height = trimH
    const offCtx = offscreen.getContext("2d")!
    offCtx.drawImage(canvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH)

    return offscreen.toDataURL("image/png")
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="
        w-full p-0 gap-0 overflow-hidden
        sm:max-w-lg
        max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:rounded-none max-sm:m-0
        flex flex-col
      ">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="
            mx-6 mb-4 rounded-lg border-2 border-dashed border-muted-foreground/30
            bg-white relative overflow-hidden
            max-sm:mx-0 max-sm:mb-0 max-sm:rounded-none max-sm:flex-1
          "
          style={{ height: 240 }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 touch-none cursor-crosshair"
          />
          {!hasStrokes && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-muted-foreground select-none">{t("serviceForm.sigDrawHere")}</p>
            </div>
          )}
          <div className="absolute bottom-10 left-6 right-6 border-b border-muted-foreground/20 pointer-events-none" />
        </div>

        <DialogFooter className="px-6 pb-6 pt-3 flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={clear} disabled={!hasStrokes}>
            <RotateCcw className="size-4 mr-1" />
            {t("serviceForm.sigClear")}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="size-4 mr-1" />
            {t("serviceForm.sigCancel")}
          </Button>
          <Button size="sm" onClick={save} disabled={!hasStrokes}>
            <Check className="size-4 mr-1" />
            {t("serviceForm.sigSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
