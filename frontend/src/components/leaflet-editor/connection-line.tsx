import { useState, useEffect, useCallback, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { Polyline, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import type { LineType, TopologyConnection } from "~/types"
import { Cable, Zap, Radio, Trash2, Plus } from "lucide-react"
import { ColorPickerMenuSection } from "~/components/ui/color-picker-menu-section"
import { offsetPolyline } from "~/lib/line-geometry"
import { useContextMenu } from "~/contexts/context-menu-context"
import { CABLE_COLORS } from "~/constants/colors"
import { useTranslation } from "react-i18next"

// Custom event for closing all connection context menus
const CLOSE_CONNECTION_MENUS_EVENT = "closeConnectionMenus"
// Custom event for deselecting all connection edit states
const DESELECT_ALL_CONNECTIONS_EVENT = "deselectAllConnections"

// Margin in map units to offset line from icon center
const ICON_MARGIN = 20

// Offset distance for parallel lines
const PARALLEL_OFFSET = 5

// Line type configurations
const LINE_TYPES: Record<LineType, { color: string; dashArray?: string; label: string; labelKey: string; icon: typeof Cable }> = {
  data: { color: CABLE_COLORS.data, dashArray: undefined, label: "Data Cable (Ethernet)", labelKey: "editor.lineTypeData", icon: Cable },
  fiber: { color: CABLE_COLORS.fiber, dashArray: "15, 5", label: "Fiber Optic", labelKey: "editor.lineTypeFiber", icon: Radio },
  electric: { color: CABLE_COLORS.electric, dashArray: "5, 5", label: "Electric Cable", labelKey: "editor.lineTypeElectric", icon: Zap },
  coaxial: { color: CABLE_COLORS.coaxial, dashArray: "10, 3, 2, 3", label: "Coaxial Cable", labelKey: "editor.lineTypeCoaxial", icon: Cable },
}

const ALL_LINE_TYPES: LineType[] = ["data", "fiber", "electric", "coaxial"]

// Shorten a line by margin amount from both ends (to not overlap with icons)
function shortenLine(
  source: L.LatLngExpression,
  target: L.LatLngExpression,
  margin: number
): [L.LatLngExpression, L.LatLngExpression] {
  const srcArr = source as [number, number]
  const tgtArr = target as [number, number]

  const dx = tgtArr[1] - srcArr[1]
  const dy = tgtArr[0] - srcArr[0]
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length < margin * 2) {
    return [source, target]
  }

  const unitLat = dy / length
  const unitLng = dx / length
  const ratio = margin

  const newSource: [number, number] = [
    srcArr[0] + unitLat * ratio,
    srcArr[1] + unitLng * ratio,
  ]
  const newTarget: [number, number] = [
    tgtArr[0] - unitLat * ratio,
    tgtArr[1] - unitLng * ratio,
  ]

  return [newSource, newTarget]
}

interface ConnectionGroupProps {
  sourcePosition: [number, number]
  targetPosition: [number, number]
  connections: TopologyConnection[]
  onDeleteConnection: (id: string) => void
  onUpdateConnectionColor?: (connectionId: string, color: string | null) => void
  onUpdateConnectionName?: (connectionId: string, name: string) => void
  onAddCable: (type: LineType) => void
  onUpdateConnectionWaypoints?: (connectionId: string, waypoints: [number, number][] | null) => void
}

export function ConnectionGroup({
  sourcePosition,
  targetPosition,
  connections,
  onDeleteConnection,
  onUpdateConnectionColor,
  onUpdateConnectionName,
  onAddCable,
  onUpdateConnectionWaypoints,
}: ConnectionGroupProps) {
  const map = useMap()
  const menuId = useId()
  const { t } = useTranslation()
  const { openContextMenu, closeContextMenu, isMenuOpen, menuPosition: globalMenuPosition } = useContextMenu()
  const contextMenuPosition = isMenuOpen(menuId) ? globalMenuPosition : null
  const [adjustedMenuPosition, setAdjustedMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [openColorPickerId, setOpenColorPickerId] = useState<string | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Which connection ID is currently selected for path editing (click-to-select)
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null)

  // Imperative layer group ref for waypoint/ghost markers during drag
  const editLayerRef = useRef<L.LayerGroup | null>(null)

  // Ref to track drag state so React re-renders don't kill the drag
  const dragStateRef = useRef<{
    connId: string
    waypoints: [number, number][]
    dragIndex: number // index into waypoints being dragged
  } | null>(null)

  const totalParallel = connections.length

  const handleContextMenu = useCallback((e: L.LeafletMouseEvent) => {
    e.originalEvent.preventDefault()
    e.originalEvent.stopPropagation()

    document.dispatchEvent(new CustomEvent(CLOSE_CONNECTION_MENUS_EVENT, { detail: { exceptId: menuId } }))

    openContextMenu(menuId, {
      x: e.originalEvent.clientX,
      y: e.originalEvent.clientY,
    })
    setOpenColorPickerId(null)
  }, [menuId, openContextMenu])

  // Close context menu when clicking elsewhere or when another menu opens
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu(menuId)
    }

    const handleCloseMenus = (e: Event) => {
      const customEvent = e as CustomEvent<{ exceptId: string }>
      if (customEvent.detail?.exceptId !== menuId) {
        closeContextMenu(menuId)
      }
    }

    document.addEventListener("click", handleClickOutside)
    document.addEventListener("contextmenu", handleClickOutside)
    document.addEventListener(CLOSE_CONNECTION_MENUS_EVENT, handleCloseMenus)

    return () => {
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("contextmenu", handleClickOutside)
      document.removeEventListener(CLOSE_CONNECTION_MENUS_EVENT, handleCloseMenus)
    }
  }, [menuId, closeContextMenu])

  // Listen for deselect-all event (when user clicks elsewhere on the map)
  useEffect(() => {
    const handleDeselect = (e: Event) => {
      const customEvent = e as CustomEvent<{ exceptGroupId?: string }>
      if (customEvent.detail?.exceptGroupId !== menuId) {
        setEditingConnectionId(null)
      }
    }

    document.addEventListener(DESELECT_ALL_CONNECTIONS_EVENT, handleDeselect)
    return () => {
      document.removeEventListener(DESELECT_ALL_CONNECTIONS_EVENT, handleDeselect)
    }
  }, [menuId])

  // Position menu in the emptiest quadrant relative to cursor.
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

  // Build full path for a connection (source + waypoints + target) with shortening and parallel offset
  const getFullPath = useCallback((conn: TopologyConnection, parallelIndex: number, waypointOverride?: [number, number][]): [number, number][] => {
    const offsetIndex = parallelIndex - (totalParallel - 1) / 2
    const offsetAmount = offsetIndex * PARALLEL_OFFSET

    const waypoints = waypointOverride || conn.waypoints || []

    // Build full multi-point path first
    let fullPath: [number, number][] = [
      sourcePosition,
      ...waypoints,
      targetPosition,
    ]

    // Apply offset for parallel lines BEFORE shortening
    if (totalParallel > 1) {
      fullPath = offsetPolyline(fullPath, offsetAmount)
    }

    // Shorten from source to first point, and from last point to target
    // This must be done AFTER offsetting to ensure proper margins
    const [shortenedSource] = shortenLine(
      fullPath[0],
      fullPath[1],
      ICON_MARGIN
    )
    const [, shortenedTarget] = shortenLine(
      fullPath[fullPath.length - 2],
      fullPath[fullPath.length - 1],
      ICON_MARGIN
    )

    // Replace first and last points with shortened versions
    fullPath[0] = shortenedSource as [number, number]
    fullPath[fullPath.length - 1] = shortenedTarget as [number, number]

    return fullPath
  }, [sourcePosition, targetPosition, totalParallel])

  // Calculate label position at the midpoint of the full path length
  const getLabelPosition = (path: [number, number][], index: number): [number, number] => {
    let totalLength = 0
    const segmentLengths: number[] = []
    for (let i = 1; i < path.length; i++) {
      const dx = path[i][1] - path[i - 1][1]
      const dy = path[i][0] - path[i - 1][0]
      const len = Math.sqrt(dx * dx + dy * dy)
      segmentLengths.push(len)
      totalLength += len
    }

    const labelT = totalParallel <= 1
      ? 0.5
      : 0.3 + (index / (totalParallel - 1)) * 0.4
    const targetDist = totalLength * labelT

    let accumulated = 0
    for (let i = 0; i < segmentLengths.length; i++) {
      if (accumulated + segmentLengths[i] >= targetDist) {
        const remainingDist = targetDist - accumulated
        const segFraction = segmentLengths[i] > 0 ? remainingDist / segmentLengths[i] : 0
        return [
          path[i][0] + (path[i + 1][0] - path[i][0]) * segFraction,
          path[i][1] + (path[i + 1][1] - path[i][1]) * segFraction,
        ]
      }
      accumulated += segmentLengths[i]
    }

    return path[path.length - 1]
  }

  // ---- Imperative waypoint/ghost marker management ----

  // Clean up the imperative edit layer
  const clearEditLayer = useCallback(() => {
    if (editLayerRef.current) {
      editLayerRef.current.clearLayers()
      map.removeLayer(editLayerRef.current)
      editLayerRef.current = null
    }
  }, [map])

  // Rebuild ghost + waypoint markers for a given connection imperatively
  const buildEditMarkers = useCallback((conn: TopologyConnection, connIndex: number) => {
    clearEditLayer()

    if (!onUpdateConnectionWaypoints) return

    const lineType = conn.lineType || "data"
    const typeConfig = LINE_TYPES[lineType] || LINE_TYPES.data
    const lineColor =
      conn.color && /^#[0-9A-Fa-f]{6}$/.test(conn.color)
        ? conn.color
        : typeConfig.color

    const layerGroup = L.layerGroup().addTo(map)
    editLayerRef.current = layerGroup

    const currentWaypoints = (): [number, number][] => {
      if (dragStateRef.current && dragStateRef.current.connId === conn.id) {
        return dragStateRef.current.waypoints
      }
      return conn.waypoints || []
    }

    // Find the polyline refs to update during drag
    const findPolylines = (): L.Polyline[] => {
      const polylines: L.Polyline[] = []
      map.eachLayer((layer) => {
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          const el = (layer as L.Polyline).getElement() as HTMLElement | null
          if (el?.dataset?.connId === conn.id) {
            polylines.push(layer)
          }
        }
      })
      return polylines
    }

    // Hide all markers in the layer group except the one being dragged
    const hideSiblingMarkers = (activeMarker: L.Marker) => {
      layerGroup.eachLayer((layer) => {
        if (layer !== activeMarker && layer instanceof L.Marker) {
          const el = (layer as L.Marker).getElement()
          if (el) el.style.display = "none"
        }
      })
    }

    const rebuildMarkers = () => {
      layerGroup.clearLayers()
      const wps = currentWaypoints()

      // Existing waypoint markers (solid, draggable)
      wps.forEach((wp, wpIndex) => {
        const marker = L.marker(wp, {
          icon: L.divIcon({
            html: `<div style="width:10px;height:10px;border-radius:50%;background:${lineColor};border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,0.4);cursor:grab"></div>`,
            className: "",
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          }),
          draggable: true,
          autoPan: false,
        })

        marker.on("dragstart", () => {
          map.dragging.disable()
          hideSiblingMarkers(marker)
          dragStateRef.current = {
            connId: conn.id,
            waypoints: [...wps],
            dragIndex: wpIndex,
          }
        })

        marker.on("drag", () => {
          if (!dragStateRef.current) return
          const latlng = marker.getLatLng()
          dragStateRef.current.waypoints[dragStateRef.current.dragIndex] = [latlng.lat, latlng.lng]

          // Update polylines in real-time
          const newPath = getFullPath(conn, connIndex, dragStateRef.current.waypoints)
          findPolylines().forEach((pl) => pl.setLatLngs(newPath))
        })

        marker.on("dragend", () => {
          map.dragging.enable()
          if (dragStateRef.current) {
            const finalWps = [...dragStateRef.current.waypoints]
            dragStateRef.current = null
            onUpdateConnectionWaypoints(conn.id, finalWps.length > 0 ? finalWps : null)
          }
        })

        marker.on("contextmenu", (e: L.LeafletMouseEvent) => {
          e.originalEvent.preventDefault()
          e.originalEvent.stopPropagation()
          // Remove this waypoint
          const newWps = wps.filter((_, i) => i !== wpIndex)
          onUpdateConnectionWaypoints(conn.id, newWps.length > 0 ? newWps : null)
        })

        layerGroup.addLayer(marker)
      })

      // Ghost markers at segment midpoints
      const rawPath: [number, number][] = [sourcePosition, ...wps, targetPosition]

      for (let i = 0; i < rawPath.length - 1; i++) {
        const mid: [number, number] = [
          (rawPath[i][0] + rawPath[i + 1][0]) / 2,
          (rawPath[i][1] + rawPath[i + 1][1]) / 2,
        ]
        const insertIndex = i // index in the waypoints array

        const ghost = L.marker(mid, {
          icon: L.divIcon({
            html: `<div style="width:10px;height:10px;border-radius:50%;background:${lineColor};opacity:0.35;border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.3);cursor:grab"></div>`,
            className: "",
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          }),
          draggable: true,
          autoPan: false,
        })

        ghost.on("dragstart", () => {
          map.dragging.disable()
          hideSiblingMarkers(ghost)
          // Insert the new waypoint immediately so the line bends from the start
          const newWps = [...wps]
          newWps.splice(insertIndex, 0, [mid[0], mid[1]])
          dragStateRef.current = {
            connId: conn.id,
            waypoints: newWps,
            dragIndex: insertIndex,
          }
        })

        ghost.on("drag", () => {
          if (!dragStateRef.current) return
          const latlng = ghost.getLatLng()
          dragStateRef.current.waypoints[dragStateRef.current.dragIndex] = [latlng.lat, latlng.lng]

          // Update polylines in real-time
          const newPath = getFullPath(conn, connIndex, dragStateRef.current.waypoints)
          findPolylines().forEach((pl) => pl.setLatLngs(newPath))
        })

        ghost.on("dragend", () => {
          map.dragging.enable()
          if (dragStateRef.current) {
            const finalWps = [...dragStateRef.current.waypoints]
            dragStateRef.current = null
            onUpdateConnectionWaypoints(conn.id, finalWps.length > 0 ? finalWps : null)
          }
        })

        layerGroup.addLayer(ghost)
      }
    }

    rebuildMarkers()
  }, [map, sourcePosition, targetPosition, clearEditLayer, onUpdateConnectionWaypoints, getFullPath])

  // When editingConnectionId changes, rebuild or clear the edit markers
  useEffect(() => {
    if (editingConnectionId && onUpdateConnectionWaypoints) {
      const connIndex = connections.findIndex((c) => c.id === editingConnectionId)
      const conn = connections[connIndex]
      if (conn) {
        buildEditMarkers(conn, connIndex)
      } else {
        clearEditLayer()
        setEditingConnectionId(null)
      }
    } else {
      clearEditLayer()
    }

    return () => {
      // Only clean up if no drag is in progress (to not destroy during drag)
      if (!dragStateRef.current) {
        clearEditLayer()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingConnectionId, connections, buildEditMarkers, clearEditLayer])

  // Left-click handler on the invisible hit area — selects this connection for path editing
  const handleLineClick = useCallback((e: L.LeafletMouseEvent, connId: string) => {
    if (!onUpdateConnectionWaypoints) return

    // Stop the click from reaching the map (which would fire onClearSelection → deselectAll)
    L.DomEvent.stopPropagation(e.originalEvent)

    // Deselect all other groups
    document.dispatchEvent(
      new CustomEvent(DESELECT_ALL_CONNECTIONS_EVENT, { detail: { exceptGroupId: menuId } })
    )

    setEditingConnectionId((prev) => (prev === connId ? null : connId))
  }, [onUpdateConnectionWaypoints, menuId])

  return (
    <>
      {/* Render each connection line */}
      {connections.map((conn, index) => {
        const lineType = conn.lineType || "data"
        const typeConfig = LINE_TYPES[lineType] || LINE_TYPES.data
        const lineColor =
          conn.color && /^#[0-9A-Fa-f]{6}$/.test(conn.color)
            ? conn.color
            : typeConfig.color
        const fullPath = getFullPath(conn, index)
        const labelPosition = getLabelPosition(fullPath, index)
        const isEditing = editingConnectionId === conn.id

        return (
          <div key={conn.id}>
            {/* Invisible wider line for easier clicking (hit area) */}
            <Polyline
              positions={fullPath}
              pathOptions={{
                color: "transparent",
                weight: 20,
                opacity: 0,
                bubblingMouseEvents: false,
              }}
              eventHandlers={{
                click: (e) => {
                  handleLineClick(e, conn.id)
                },
                contextmenu: handleContextMenu,
              }}
            />
            {/* Visible line — add data attribute so imperative markers can find it */}
            <Polyline
              ref={(ref) => {
                if (ref) {
                  const el = ref.getElement() as HTMLElement | null
                  if (el) {
                    el.dataset.connId = conn.id
                  }
                }
              }}
              positions={fullPath}
              pathOptions={{
                color: lineColor,
                weight: isEditing ? 4 : 3,
                opacity: isEditing ? 1 : 0.8,
                dashArray: typeConfig.dashArray,
                lineJoin: 'round',
                lineCap: 'round',
                bubblingMouseEvents: false,
              }}
              eventHandlers={{
                click: (e) => {
                  handleLineClick(e, conn.id)
                },
                contextmenu: handleContextMenu,
              }}
            />
            {/* Cable name label at midpoint */}
            {conn.name && (
              <Marker
                position={labelPosition}
                icon={L.divIcon({
                  html: `<span style="font-size:9px;font-weight:600;color:${lineColor};background:rgba(255,255,255,0.9);padding:1px 5px;border-radius:2px;white-space:nowrap;line-height:1.2;pointer-events:none">${conn.name}</span>`,
                  className: "",
                  iconAnchor: [0, 0],
                })}
                interactive={false}
              />
            )}
          </div>
        )
      })}

      {/* Unified Context Menu Portal */}
      {contextMenuPosition && createPortal(
        <div
          ref={contextMenuRef}
          className="fixed z-[9999] min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{
            left: adjustedMenuPosition?.x ?? contextMenuPosition.x,
            top: adjustedMenuPosition?.y ?? contextMenuPosition.y,
            visibility: adjustedMenuPosition ? 'visible' : 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Existing Cables Section */}
          <div className="px-2 py-1.5 text-sm font-semibold">
            {t("connLine.cablesCount", { count: connections.length })}
          </div>
          <div className="-mx-1 my-1 h-px bg-border" />

          {connections.map((conn) => {
            const lineType = conn.lineType || "data"
            const config = LINE_TYPES[lineType]
            const Icon = config.icon
            const displayColor =
              conn.color && /^#[0-9A-Fa-f]{6}$/.test(conn.color)
                ? conn.color
                : config.color
            const isPickerOpen = openColorPickerId === conn.id
            return (
              <div key={conn.id}>
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: displayColor }} />
                  <span className="flex-1 text-xs text-muted-foreground">{t(config.labelKey)}</span>
                  {onUpdateConnectionColor && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenColorPickerId(isPickerOpen ? null : conn.id)
                      }}
                      className="w-4 h-4 rounded-full border border-border shrink-0 hover:scale-110 transition-transform"
                      style={{ backgroundColor: displayColor }}
                      title={t("connLine.changeColor")}
                    />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteConnection(conn.id)
                      if (connections.length === 1) {
                        closeContextMenu(menuId)
                      }
                    }}
                    className="p-1 hover:bg-destructive/20 rounded transition-colors"
                    title={t("connLine.deleteCable")}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
                {onUpdateConnectionName && (
                  <div className="px-2 pb-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={conn.name || ""}
                      onChange={(e) => onUpdateConnectionName(conn.id, e.target.value)}
                      placeholder={t("connLine.cableNamePlaceholder")}
                      className="w-full text-xs bg-muted/50 px-2 py-1 rounded border border-border hover:border-primary/50 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                )}
                {onUpdateConnectionColor && isPickerOpen && (
                  <div className="px-1 pb-1" onClick={(e) => e.stopPropagation()}>
                    <ColorPickerMenuSection
                      color={conn.color}
                      onColorChange={(color) =>
                        onUpdateConnectionColor(conn.id, color)
                      }
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* Add Cable Section */}
          <div className="-mx-1 my-1 h-px bg-border" />
          <div className="px-2 py-1.5 text-sm font-semibold">{t("connLine.addCable")}</div>
          {ALL_LINE_TYPES.map((type) => {
            const config = LINE_TYPES[type]
            return (
              <button
                key={`add-${type}`}
                className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onAddCable(type)
                }}
              >
                <Plus className="h-4 w-4" style={{ color: config.color }} />
                <span>{t(config.labelKey)}</span>
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}

export { LINE_TYPES }
