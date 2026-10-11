import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Marker } from "react-leaflet"
import { COLOR_FALLBACK_HEX } from "~/constants/colors"
import type L from "leaflet"
import { Trash2, RotateCcw, RotateCw, StickyNote, Copy, FlipHorizontal2, FlipVertical2, ServerOff, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, PanelRightOpen, Pencil } from "lucide-react"
import { createInfrastructureLeafletIcon, InfrastructureType, type ChildDeviceInfo, deviceIcons, deviceColors, DeviceType, type ChildSocketInfo, socketColors, socketIcons, createInfrastructureLeafletIconForWorkstation, SocketType, type LabelPosition } from "../icons"
import { useTranslation } from "react-i18next"
import { useTypeLabels } from "~/hooks/use-type-labels"
import { ALIGNMENT_DRAG_EVENT, ALIGNMENT_DRAG_END_EVENT, type AlignmentDragPayload, snapPosition } from "../map/alignment-guides"
import { ColorPickerMenuSection } from "../ui/color-picker-menu-section"
import { useContextMenu } from "~/contexts/context-menu-context"

// Extended child device info with ID for removal
interface ChildSocketWithId extends ChildSocketInfo {
  id: string
}

interface WorkstationMarkerProps {
  id: string
  type: InfrastructureType
  lat: number
  lng: number
  rotation: number
  label: string
  color?: string | null
  note?: string | null
  flipX?: boolean
  flipY?: boolean
  isSelected?: boolean
  isPendingConnection?: boolean
  draggable?: boolean
  childSockets: ChildSocketInfo[]
  childSocketsWithId: ChildSocketWithId[]
  labelPosition?: LabelPosition | null
  onClick?: () => void
  onShiftClick?: () => void
  onDrag?: (lat: number, lng: number) => void
  onDragEnd?: (lat: number, lng: number) => void
  onDelete?: () => void
  onRotate?: (degrees: number) => void
  onSetRotation?: (degrees: number) => void
  onFlipX?: () => void
  onFlipY?: () => void
  onUpdateNote?: (note: string) => void
  onUpdateLabel?: (label: string) => void
  onUpdateColor?: (color: string | null) => void
  onUpdateLabelPosition?: (position: LabelPosition) => void
  onDuplicate?: () => void
  onRemoveChildSocket?: (socketId: string) => void
}

export function WorkstationMarker({
  id,
  type,
  lat,
  lng,
  rotation,
  label,
  color,
  note,
  flipX = false,
  flipY = false,
  isSelected = false,
  isPendingConnection = false,
  draggable = true,
  childSockets = [],
  childSocketsWithId = [],
  labelPosition,
  onClick,
  onShiftClick,
  onDrag,
  onDragEnd,
  onDelete,
  onRotate,
  onFlipX,
  onFlipY,
  onUpdateNote,
  onUpdateLabel,
  onUpdateColor,
  onUpdateLabelPosition,
  onDuplicate,
  onRemoveChildSocket,
}: WorkstationMarkerProps) {
  const { openContextMenu, closeContextMenu, isMenuOpen, menuPosition: globalMenuPosition } = useContextMenu()
  const { t } = useTranslation()
  const { infrastructureLabels } = useTypeLabels()
  const menuId = `workstation-${id}`
  const contextMenuPosition = isMenuOpen(menuId) ? globalMenuPosition : null
  const [adjustedMenuPosition, setAdjustedMenuPosition] = useState<{ x: number; y: number } | null>(null)

  const [isEditingNote, setIsEditingNote] = useState(false)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isChildDevicesOpen, setIsChildDevicesOpen] = useState(false)
  const [noteValue, setNoteValue] = useState(note || "")
  const [labelValue, setLabelValue] = useState(label)

  const noteInputRef = useRef<HTMLTextAreaElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Update noteValue when note prop changes
  useEffect(() => {
    setNoteValue(note || "")
  }, [note])

  // Update labelValue when label prop changes
  useEffect(() => {
    setLabelValue(label)
  }, [label])

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditingNote && noteInputRef.current) {
      noteInputRef.current.focus()
      noteInputRef.current.select()
    }
  }, [isEditingNote])

  // Focus input when editing label starts
  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus()
      labelInputRef.current.select()
    }
  }, [isEditingLabel])

  // Position menu in the emptiest quadrant relative to cursor so the component stays visible.
  // Runs on open and whenever the menu resizes (e.g. color picker toggle).
  useEffect(() => {
    if (!contextMenuPosition || !contextMenuRef.current) {
      setAdjustedMenuPosition(null)
      return
    }

    const reposition = () => {
      const menu = contextMenuRef.current
      if (!menu) return
      const menuRect = menu.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const padding = 8
      const gap = 16
      const cx = contextMenuPosition.x
      const cy = contextMenuPosition.y

      const x = cx + menuRect.width + gap <= vw - padding
        ? cx + gap
        : cx - menuRect.width - gap

      const y = cy + menuRect.height + gap <= vh - padding
        ? cy + gap
        : cy - menuRect.height - gap

      setAdjustedMenuPosition({
        x: Math.max(padding, Math.min(x, vw - menuRect.width - padding)),
        y: Math.max(padding, Math.min(y, vh - menuRect.height - padding)),
      })
    }

    reposition()
    const ro = new ResizeObserver(reposition)
    ro.observe(contextMenuRef.current)
    return () => ro.disconnect()
  }, [contextMenuPosition])

  const handleContextMenu = useCallback((e: L.LeafletMouseEvent) => {
    e.originalEvent.preventDefault()
    e.originalEvent.stopPropagation()

    openContextMenu(menuId, {
      x: e.originalEvent.clientX,
      y: e.originalEvent.clientY,
    })
    setIsEditingNote(false)
    setIsEditingLabel(false)
    setIsColorPickerOpen(false)
    setIsChildDevicesOpen(false)
  }, [map, menuId, openContextMenu])

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking inside the context menu
      const target = e.target as HTMLElement
      if (target.closest('[data-infrastructure-context-menu]')) {
        return
      }
      closeContextMenu(menuId)
      setIsEditingNote(false)
      setIsEditingLabel(false)
    }

    const handleContextMenuOutside = () => {
      closeContextMenu(menuId)
      setIsEditingNote(false)
      setIsEditingLabel(false)
    }

    if (contextMenuPosition) {
      document.addEventListener("click", handleClickOutside)
      document.addEventListener("contextmenu", handleContextMenuOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("contextmenu", handleContextMenuOutside)
    }
  }, [contextMenuPosition, menuId, closeContextMenu])

  const handleSaveNote = useCallback(() => {
    onUpdateNote?.(noteValue)
    setIsEditingNote(false)
    closeContextMenu(menuId)
  }, [noteValue, onUpdateNote, menuId, closeContextMenu])

  const handleNoteKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveNote()
    }
    if (e.key === "Escape") {
      setNoteValue(note || "")
      setIsEditingNote(false)
    }
  }, [handleSaveNote, note])

  const handleSaveLabel = useCallback(() => {
    if (labelValue.trim()) {
      onUpdateLabel?.(labelValue.trim())
    }
    setIsEditingLabel(false)
  }, [labelValue, onUpdateLabel])

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveLabel()
    }
    if (e.key === "Escape") {
      setLabelValue(label)
      setIsEditingLabel(false)
    }
  }, [handleSaveLabel, label])

  return (
    <>
      <Marker
        position={[lat, lng]}
        icon={createInfrastructureLeafletIconForWorkstation(type, color, isSelected || isPendingConnection, rotation, flipX, flipY, label, childSockets, labelPosition || undefined)}
        draggable={draggable}
        eventHandlers={{
          click: (e) => {

            e.originalEvent.stopPropagation()

            const mouseEvent = e.originalEvent as MouseEvent

            // ⇧ Shift + Click → open drawer
            if (mouseEvent.shiftKey) {
              onShiftClick?.()

              return
            }

            onClick?.()
          },
          contextmenu: handleContextMenu,
          drag: (e: L.LeafletEvent) => {
            const marker = e.target as L.Marker
            const { lat: rawLat, lng: rawLng } = marker.getLatLng()
            const snapped = snapPosition(rawLat, rawLng, id)
            if (snapped.lat !== rawLat || snapped.lng !== rawLng) {
              marker.setLatLng([snapped.lat, snapped.lng])
            }
            window.dispatchEvent(new CustomEvent<AlignmentDragPayload>(ALIGNMENT_DRAG_EVENT, { detail: { lat: snapped.lat, lng: snapped.lng, id } }))
            onDrag?.(snapped.lat, snapped.lng)
          },
          dragend: (e: L.DragEndEvent) => {
            const marker = e.target as L.Marker
            const { lat: newLat, lng: newLng } = marker.getLatLng()
            window.dispatchEvent(new CustomEvent(ALIGNMENT_DRAG_END_EVENT))
            onDragEnd?.(newLat, newLng)
          },
        }}
      />

      {/* Context Menu Portal */}
      {contextMenuPosition && createPortal(
        <div
          ref={contextMenuRef}
          data-infrastructure-context-menu
          className="fixed z-[9999] min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{
            left: adjustedMenuPosition?.x ?? contextMenuPosition.x,
            top: adjustedMenuPosition?.y ?? contextMenuPosition.y,
            visibility: adjustedMenuPosition ? 'visible' : 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Win11-style header: type label + name + icon toolbar */}
          <div className="px-2 pt-1.5 pb-0.5 text-xs text-muted-foreground">
            {infrastructureLabels[type]}
          </div>

          {/* Name display / inline edit */}
          {isEditingLabel ? (
            <div className="px-2 pb-1.5">
              <input
                ref={labelInputRef}
                type="text"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                onKeyDown={handleLabelKeyDown}
                onBlur={handleSaveLabel}
                className="w-full bg-secondary text-foreground text-sm font-semibold rounded px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={t("marker.namePlaceholder")}
              />
            </div>
          ) : (
            <div className="px-2 pb-1.5 text-sm font-semibold flex items-center justify-between cursor-text hover:bg-accent/50 rounded" onClick={() => setIsEditingLabel(true)}>
              <span className="truncate">{label}</span>
              <Pencil className="h-3 w-3 shrink-0 text-muted-foreground ml-2" />
            </div>
          )}

          {/* Win11-style action toolbar */}
          <div className="-mx-1 mb-1 h-px bg-border" />
          <div className="flex items-center px-1 pb-1 gap-0.5">
            <button
              className="flex flex-col items-center gap-0.5 flex-1 rounded-sm px-1 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => { onDuplicate?.(); closeContextMenu(menuId) }}
              title={t("marker.duplicate")}
            >
              <Copy className="h-4 w-4" />
              <span>{t("marker.copy")}</span>
            </button>
            <button
              className="flex flex-col items-center gap-0.5 flex-1 rounded-sm px-1 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setIsEditingNote(true)}
              title={note ? t("marker.editNote") : t("marker.addNote")}
            >
              <StickyNote className="h-4 w-4" />
              <span>{t("marker.note")}</span>
            </button>
            <button
              className="flex flex-col items-center gap-0.5 flex-1 rounded-sm px-1 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => { onShiftClick?.(); closeContextMenu(menuId) }}
              title={t("marker.openDrawer")}
            >
              <PanelRightOpen className="h-4 w-4" />
              <span>{t("marker.open")}</span>
            </button>
            <button
              className="flex flex-col items-center gap-0.5 flex-1 rounded-sm px-1 py-1.5 text-xs outline-none transition-colors hover:bg-accent text-destructive hover:text-destructive"
              onClick={() => { onDelete?.(); closeContextMenu(menuId) }}
              title={t("marker.delete")}
            >
              <Trash2 className="h-4 w-4" />
              <span>{t("marker.delete")}</span>
            </button>
          </div>
          <div className="-mx-1 mb-1 h-px bg-border" />

          {/* Note inline editor (shown when editing) */}
          {isEditingNote && (
            <div className="px-2 pb-1.5">
              <textarea
                ref={noteInputRef}
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onKeyDown={handleNoteKeyDown}
                className="w-full bg-secondary text-foreground text-sm rounded p-2 resize-none border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                rows={3}
                placeholder={t("marker.addNotePlaceholder")}
              />
              <div className="flex gap-2 mt-1.5">
                <button
                  className="flex-1 px-2 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/80 transition-colors"
                  onClick={handleSaveNote}
                >{t("marker.save")}</button>
                <button
                  className="flex-1 px-2 py-1 bg-secondary text-foreground text-xs rounded hover:bg-accent transition-colors"
                  onClick={() => { setNoteValue(note || ""); setIsEditingNote(false) }}
                >{t("marker.cancel")}</button>
              </div>
            </div>
          )}

          {/* Quick Rotate Section */}
          <div className="px-2 py-1 text-xs text-muted-foreground">{t("marker.quickRotate")}</div>
          <div className="grid grid-cols-4 gap-1 px-1 pb-1">
            <button
              className="flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => onRotate?.(90)}
              title={t("marker.rotate90cw")}
            >
              <RotateCw className="h-3 w-3" />
              90°
            </button>
            <button
              className="flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => onRotate?.(180)}
              title={t("marker.rotate180")}
            >
              <RotateCw className="h-3 w-3" />
              180°
            </button>
            <button
              className="flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => onRotate?.(-90)}
              title={t("marker.rotate90ccw")}
            >
              <RotateCcw className="h-3 w-3" />
              90°
            </button>
          </div>

          {/* Flip Section */}
          <div className="px-2 py-1 text-xs text-muted-foreground">{t("marker.flip")}</div>
          <div className="grid grid-cols-2 gap-1 px-1 pb-1">
            <button
              className={`flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${flipX ? "bg-accent" : ""}`}
              onClick={() => onFlipX?.()}
              title={t("marker.flipHorizontal")}
            >
              <FlipHorizontal2 className="h-3 w-3" />
              {t("marker.horizontal")}
            </button>
            <button
              className={`flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${flipY ? "bg-accent" : ""}`}
              onClick={() => onFlipY?.()}
              title={t("marker.flipVertical")}
            >
              <FlipVertical2 className="h-3 w-3" />
              {t("marker.vertical")}
            </button>
          </div>

          {/* Label Position Section */}
          {onUpdateLabelPosition && (
            <>
              <div className="px-2 py-1 text-xs text-muted-foreground">{t("marker.labelPosition")}</div>
              <div className="grid grid-cols-4 gap-1 px-1 pb-1">
                <button
                  className={`flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${labelPosition === "top" ? "bg-accent" : ""}`}
                  onClick={() => onUpdateLabelPosition("top")}
                  title={t("marker.labelOnTop")}
                >
                  <ArrowUp className="h-3 w-3" />
                  {t("marker.up")}
                </button>
                <button
                  className={`flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${labelPosition === "bottom" || !labelPosition ? "bg-accent" : ""}`}
                  onClick={() => onUpdateLabelPosition("bottom")}
                  title={t("marker.labelOnBottom")}
                >
                  <ArrowDown className="h-3 w-3" />
                  {t("marker.down")}
                </button>
                <button
                  className={`flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${labelPosition === "left" ? "bg-accent" : ""}`}
                  onClick={() => onUpdateLabelPosition("left")}
                  title={t("marker.labelOnLeft")}
                >
                  <ArrowLeft className="h-3 w-3" />
                  {t("marker.left")}
                </button>
                <button
                  className={`flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${labelPosition === "right" ? "bg-accent" : ""}`}
                  onClick={() => onUpdateLabelPosition("right")}
                  title={t("marker.labelOnRight")}
                >
                  <ArrowRight className="h-3 w-3" />
                  {t("marker.right")}
                </button>
              </div>
            </>
          )}

          {/* Fine Rotate Section */}
          <div className="px-2 py-1 text-xs text-muted-foreground">{t("marker.fineTune")}</div>
          <div className="grid grid-cols-4 gap-1 px-1 pb-1">
            <button
              className="flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => onRotate?.(-45)}
              title={t("marker.rotate45ccw")}
            >
              <RotateCcw className="h-3 w-3" />
              45°
            </button>
            <button
              className="flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => onRotate?.(-5)}
              title={t("marker.rotate5ccw")}
            >
              <RotateCcw className="h-3 w-3" />
              5°
            </button>
            <button
              className="flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => onRotate?.(5)}
              title={t("marker.rotate5cw")}
            >
              <RotateCw className="h-3 w-3" />
              5°
            </button>
            <button
              className="flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => onRotate?.(45)}
              title={t("marker.rotate45cw")}
            >
              <RotateCw className="h-3 w-3" />
              45°
            </button>
          </div>

          {/* Color Section */}
          {onUpdateColor && (
            <>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button
                className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => { e.stopPropagation(); setIsColorPickerOpen((v) => !v) }}
              >
                <div
                  className="w-4 h-4 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : COLOR_FALLBACK_HEX }}
                />
                <span>{t("marker.color")}</span>
                {isColorPickerOpen ? <ChevronUp className="ml-auto h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              {isColorPickerOpen && (
                <div className="px-1 pb-1" onClick={(e) => e.stopPropagation()}>
                  <ColorPickerMenuSection
                    color={color}
                    onColorChange={onUpdateColor}
                  />
                </div>
              )}
            </>
          )}

          {/* Child Devices Section - only show if there are child devices */}
          {childSocketsWithId.length > 0 && (
            <>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button
                className="w-full px-2 py-1 text-xs text-muted-foreground flex items-center gap-1 hover:bg-accent rounded-sm transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsChildDevicesOpen((v) => !v) }}
              >
                <span className="flex-1 text-left">Child Devices ({childSocketsWithId.length})</span>
                {isChildDevicesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {isChildDevicesOpen && (
                <div className="max-h-[150px] overflow-y-auto">
                  {childSocketsWithId.map((socket) => {
                    const SocketIcon = socketIcons[socket.type as SocketType]
                    const socketColor = socketColors[socket.type as SocketType]
                    return (
                      <div
                        key={socket.id}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent/50 rounded-sm"
                      >
                        <SocketIcon className="h-4 w-4 shrink-0" style={{ color: socketColor }} />
                        <span className="flex-1 truncate" title={socket.name}>
                          {socket.name}
                        </span>
                        <button
                          className="p-1 rounded hover:bg-destructive/20 text-orange-600 transition-colors"
                          onClick={() => {
                            onRemoveChildSocket?.(socket.id)
                            closeContextMenu(menuId)
                          }}
                          title={`Remove ${socket.name} from ${label}`}
                        >
                          <ServerOff className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

        </div>,
        document.body
      )}
    </>
  )
}
