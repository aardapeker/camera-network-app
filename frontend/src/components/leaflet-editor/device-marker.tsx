import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Marker } from "react-leaflet"
import { COLOR_FALLBACK_HEX } from "~/constants/colors"
import type L from "leaflet"
import { Trash2, RotateCcw, RotateCw, StickyNote, Copy, FlipHorizontal2, FlipVertical2, Globe, ServerOff, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Pencil, Tag, Cpu, Hash, Camera } from "lucide-react"
import { createLeafletIcon, DeviceType, CameraSubtype, type LabelPosition } from "../icons"
import { ALIGNMENT_DRAG_EVENT, ALIGNMENT_DRAG_END_EVENT, type AlignmentDragPayload, snapPosition } from "../map/alignment-guides"
import { ColorPickerMenuSection } from "../ui/color-picker-menu-section"
import { useContextMenu } from "~/contexts/context-menu-context"
import { useTranslation } from "react-i18next"
import { useTypeLabels } from "~/hooks/use-type-labels"

interface DeviceMarkerProps {
  id: string
  type: DeviceType
  lat: number
  lng: number
  rotation: number
  label: string
  color?: string | null
  note?: string | null
  ipAddress?: string | null
  brand?: string | null
  model?: string | null
  serialNumber?: string | null
  subtype?: string | null
  flipX?: boolean
  flipY?: boolean
  isSelected?: boolean
  isPendingConnection?: boolean
  draggable?: boolean
  rackCabinId?: string | null
  rackCabinName?: string | null
  labelPosition?: LabelPosition | null
  onClick?: () => void
  onDrag?: (lat: number, lng: number) => void
  onDragEnd?: (lat: number, lng: number) => void
  onDelete?: () => void
  onRotate?: (degrees: number) => void
  onSetRotation?: (degrees: number) => void
  onFlipX?: () => void
  onFlipY?: () => void
  onUpdateNote?: (note: string) => void
  onUpdateLabel?: (label: string) => void
  onUpdateIp?: (ip: string) => void
  onUpdateBrand?: (brand: string) => void
  onUpdateModel?: (model: string) => void
  onUpdateSerialNumber?: (serialNumber: string) => void
  onUpdateSubtype?: (subtype: string | null) => void
  onUpdateColor?: (color: string | null) => void
  onUpdateLabelPosition?: (position: LabelPosition) => void
  onDuplicate?: () => void
  onRemoveFromRackCabin?: () => void
}

export function DeviceMarker({
  id,
  type,
  lat,
  lng,
  rotation,
  label,
  color,
  note,
  ipAddress,
  brand,
  model,
  serialNumber,
  subtype,
  flipX = false,
  flipY = false,
  isSelected = false,
  isPendingConnection = false,
  draggable = true,
  rackCabinId,
  rackCabinName,
  labelPosition,
  onClick,
  onDragEnd,
  onDelete,
  onRotate,
  onSetRotation,
  onFlipX,
  onFlipY,
  onUpdateNote,
  onUpdateLabel,
  onUpdateIp,
  onUpdateBrand,
  onUpdateModel,
  onUpdateSerialNumber,
  onUpdateSubtype,
  onUpdateColor,
  onDrag,
  onUpdateLabelPosition,
  onDuplicate,
  onRemoveFromRackCabin,
}: DeviceMarkerProps) {
  const { openContextMenu, closeContextMenu, isMenuOpen, menuPosition: globalMenuPosition } = useContextMenu()
  const { t } = useTranslation()
  const { deviceLabels, cameraSubtypeLabels } = useTypeLabels()
  const menuId = `device-${id}`
  const contextMenuPosition = isMenuOpen(menuId) ? globalMenuPosition : null
  const [adjustedMenuPosition, setAdjustedMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isEditingIp, setIsEditingIp] = useState(false)
  const [isEditingBrand, setIsEditingBrand] = useState(false)
  const [isEditingModel, setIsEditingModel] = useState(false)
  const [isEditingSerialNumber, setIsEditingSerialNumber] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isDeviceInfoOpen, setIsDeviceInfoOpen] = useState(false)
  const [noteValue, setNoteValue] = useState(note || "")
  const [labelValue, setLabelValue] = useState(label)
  const [ipValue, setIpValue] = useState(ipAddress || "192.168.1.1")
  const [brandValue, setBrandValue] = useState(brand || "")
  const [modelValue, setModelValue] = useState(model || "")
  const [serialNumberValue, setSerialNumberValue] = useState(serialNumber || "")
  const noteInputRef = useRef<HTMLTextAreaElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const ipInputRef = useRef<HTMLInputElement>(null)
  const brandInputRef = useRef<HTMLInputElement>(null)
  const modelInputRef = useRef<HTMLInputElement>(null)
  const serialNumberInputRef = useRef<HTMLInputElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Update noteValue when note prop changes
  useEffect(() => {
    setNoteValue(note || "")
  }, [note])

  // Update labelValue when label prop changes
  useEffect(() => {
    setLabelValue(label)
  }, [label])

  // Update ipValue when ipAddress prop changes
  useEffect(() => {
    setIpValue(ipAddress || "192.168.1.1")
  }, [ipAddress])

  useEffect(() => { setBrandValue(brand || "") }, [brand])
  useEffect(() => { setModelValue(model || "") }, [model])
  useEffect(() => { setSerialNumberValue(serialNumber || "") }, [serialNumber])

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

  // Focus input when editing IP starts
  useEffect(() => {
    if (isEditingIp && ipInputRef.current) {
      ipInputRef.current.focus()
      ipInputRef.current.select()
    }
  }, [isEditingIp])

  useEffect(() => {
    if (isEditingBrand && brandInputRef.current) {
      brandInputRef.current.focus()
      brandInputRef.current.select()
    }
  }, [isEditingBrand])

  useEffect(() => {
    if (isEditingModel && modelInputRef.current) {
      modelInputRef.current.focus()
      modelInputRef.current.select()
    }
  }, [isEditingModel])

  useEffect(() => {
    if (isEditingSerialNumber && serialNumberInputRef.current) {
      serialNumberInputRef.current.focus()
      serialNumberInputRef.current.select()
    }
  }, [isEditingSerialNumber])

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
    setIsEditingIp(false)
    setIsEditingBrand(false)
    setIsEditingModel(false)
    setIsEditingSerialNumber(false)
    setIsColorPickerOpen(false)
    setIsDeviceInfoOpen(false)
  }, [menuId, openContextMenu])

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking inside the context menu
      const target = e.target as HTMLElement
      if (target.closest('[data-device-context-menu]')) {
        return
      }
      closeContextMenu(menuId)
      setIsEditingNote(false)
      setIsEditingLabel(false)
      setIsEditingIp(false)
      setIsEditingBrand(false)
      setIsEditingModel(false)
      setIsEditingSerialNumber(false)
    }

    const handleContextMenuOutside = () => {
      closeContextMenu(menuId)
      setIsEditingNote(false)
      setIsEditingLabel(false)
      setIsEditingIp(false)
      setIsEditingBrand(false)
      setIsEditingModel(false)
      setIsEditingSerialNumber(false)
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

  const handleSaveIp = useCallback(() => {
    if (ipValue.trim()) {
      onUpdateIp?.(ipValue.trim())
    }
    setIsEditingIp(false)
  }, [ipValue, onUpdateIp])

  const handleIpKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveIp()
    }
    if (e.key === "Escape") {
      setIpValue(ipAddress || "192.168.1.1")
      setIsEditingIp(false)
    }
  }, [handleSaveIp, ipAddress])

  const handleSaveBrand = useCallback(() => {
    onUpdateBrand?.(brandValue.trim())
    setIsEditingBrand(false)
  }, [brandValue, onUpdateBrand])

  const handleBrandKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSaveBrand() }
    if (e.key === "Escape") { setBrandValue(brand || ""); setIsEditingBrand(false) }
  }, [handleSaveBrand, brand])

  const handleSaveModel = useCallback(() => {
    onUpdateModel?.(modelValue.trim())
    setIsEditingModel(false)
  }, [modelValue, onUpdateModel])

  const handleModelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSaveModel() }
    if (e.key === "Escape") { setModelValue(model || ""); setIsEditingModel(false) }
  }, [handleSaveModel, model])

  const handleSaveSerialNumber = useCallback(() => {
    onUpdateSerialNumber?.(serialNumberValue.trim())
    setIsEditingSerialNumber(false)
  }, [serialNumberValue, onUpdateSerialNumber])

  const handleSerialNumberKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSaveSerialNumber() }
    if (e.key === "Escape") { setSerialNumberValue(serialNumber || ""); setIsEditingSerialNumber(false) }
  }, [handleSaveSerialNumber, serialNumber])

  return (
    <>
      <Marker
        position={[lat, lng]}
        icon={createLeafletIcon(type, color, isSelected || isPendingConnection, rotation, flipX, flipY, label, ipAddress, labelPosition || undefined, subtype)}
        draggable={draggable}
        eventHandlers={{
          click: (e) => {
            e.originalEvent.stopPropagation()
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
          data-device-context-menu
          className="fixed z-[9999] min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{
            left: adjustedMenuPosition?.x ?? contextMenuPosition.x,
            top: adjustedMenuPosition?.y ?? contextMenuPosition.y,
            visibility: adjustedMenuPosition ? 'visible' : 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Win11-style header: type label + name + icon toolbar */}
          <div className="px-2 pt-1.5 pb-0.5 text-xs text-muted-foreground flex items-center gap-1.5">
            <span>{deviceLabels[type]}</span>
            {type === DeviceType.CAMERA && (
              <div className="ml-auto flex items-center gap-1">
                <Camera className="h-3 w-3 text-muted-foreground" />
                <select
                  className="text-xs bg-secondary text-foreground rounded px-1 py-0.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  value={subtype || ""}
                  onChange={(e) => onUpdateSubtype?.(e.target.value || null)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">{t("marker.generic")}</option>
                  {Object.values(CameraSubtype).map((st) => (
                    <option key={st} value={st}>{cameraSubtypeLabels[st]}</option>
                  ))}
                </select>
              </div>
            )}
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
                placeholder={t("marker.deviceNamePlaceholder")}
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

          {/* Device Info — collapsible */}
          <div className="-mx-1 my-1 h-px bg-border" />
          <button
            className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={(e) => { e.stopPropagation(); setIsDeviceInfoOpen((v) => !v) }}
          >
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-left">{t("marker.deviceInfo")}</span>
            {isDeviceInfoOpen ? <ChevronUp className="ml-auto h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          {isDeviceInfoOpen && (
            <div className="px-1 pb-1" onClick={(e) => e.stopPropagation()}>
              {/* IP */}
              {isEditingIp ? (
                <div className="flex items-center gap-1.5 px-1 py-1">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    ref={ipInputRef}
                    type="text"
                    value={ipValue}
                    onChange={(e) => setIpValue(e.target.value)}
                    onKeyDown={handleIpKeyDown}
                    onBlur={handleSaveIp}
                    className="flex-1 bg-secondary text-foreground text-xs rounded px-1.5 py-0.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder={t("marker.ipPlaceholder")}
                  />
                </div>
              ) : (
                <button
                  className="w-full flex items-center gap-1.5 px-1 py-1 text-xs rounded hover:bg-accent transition-colors text-left"
                  onClick={() => setIsEditingIp(true)}
                >
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-muted-foreground">{ipAddress || t("marker.ipPlaceholder")}</span>
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              {/* Brand */}
              {isEditingBrand ? (
                <div className="flex items-center gap-1.5 px-1 py-1">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    ref={brandInputRef}
                    type="text"
                    value={brandValue}
                    onChange={(e) => setBrandValue(e.target.value)}
                    onKeyDown={handleBrandKeyDown}
                    onBlur={handleSaveBrand}
                    className="flex-1 bg-secondary text-foreground text-xs rounded px-1.5 py-0.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder={t("marker.brandPlaceholder")}
                  />
                </div>
              ) : (
                <button
                  className="w-full flex items-center gap-1.5 px-1 py-1 text-xs rounded hover:bg-accent transition-colors text-left"
                  onClick={() => setIsEditingBrand(true)}
                >
                  <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-muted-foreground">{brand || t("marker.brandEmpty")}</span>
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              {/* Model */}
              {isEditingModel ? (
                <div className="flex items-center gap-1.5 px-1 py-1">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    ref={modelInputRef}
                    type="text"
                    value={modelValue}
                    onChange={(e) => setModelValue(e.target.value)}
                    onKeyDown={handleModelKeyDown}
                    onBlur={handleSaveModel}
                    className="flex-1 bg-secondary text-foreground text-xs rounded px-1.5 py-0.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder={t("marker.modelPlaceholder")}
                  />
                </div>
              ) : (
                <button
                  className="w-full flex items-center gap-1.5 px-1 py-1 text-xs rounded hover:bg-accent transition-colors text-left"
                  onClick={() => setIsEditingModel(true)}
                >
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-muted-foreground">{model || t("marker.modelEmpty")}</span>
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              {/* Serial Number */}
              {isEditingSerialNumber ? (
                <div className="flex items-center gap-1.5 px-1 py-1">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    ref={serialNumberInputRef}
                    type="text"
                    value={serialNumberValue}
                    onChange={(e) => setSerialNumberValue(e.target.value)}
                    onKeyDown={handleSerialNumberKeyDown}
                    onBlur={handleSaveSerialNumber}
                    className="flex-1 bg-secondary text-foreground text-xs rounded px-1.5 py-0.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder={t("marker.serialPlaceholder")}
                  />
                </div>
              ) : (
                <button
                  className="w-full flex items-center gap-1.5 px-1 py-1 text-xs rounded hover:bg-accent transition-colors text-left"
                  onClick={() => setIsEditingSerialNumber(true)}
                >
                  <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-muted-foreground">{serialNumber || t("marker.serialPlaceholder")}</span>
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
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

          {/* Remove from Rack Cabin - only show if device is in a rack cabin */}
          {rackCabinId && (
            <>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button
                className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-orange-600"
                onClick={() => {
                  onRemoveFromRackCabin?.()
                  closeContextMenu(menuId)
                }}
              >
                <ServerOff className="h-4 w-4" />
                <span>{t("marker.removeFrom", { name: rackCabinName || t("marker.rackCabinFallback") })}</span>
              </button>
            </>
          )}

        </div>,
        document.body
      )}
    </>
  )
}
