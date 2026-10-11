import L from "leaflet"
import { renderToStaticMarkup } from "react-dom/server"
import { DEVICE_COLORS, INFRASTRUCTURE_COLORS, SOCKET_COLORS, COLOR_FALLBACK } from "~/constants/colors"
import {
  Router,
  Wifi,
  Server,
  Monitor,
  HardDrive,
  Network,
  Plug,
  Cable,
  Zap,
  PcCase,
  Volume2,
  Video,
} from "lucide-react"
import { EthernetOutletIcon, NormalOutletIcon, UPSOutletIcon, DomeCameraIcon, BulletCameraIcon, SpeedDomeCameraIcon, ThermalCameraIcon, FisheyeCameraIcon, MotorizedBulletCameraIcon } from "./cctv-icon"
import React, { useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  setTouchDragData,
  clearTouchDragData,
  setTouchGhost,
  getTouchGhost,
} from "~/lib/touch-drag"

/** Dispatched on window when a sidebar drag begins (touch or mouse) so the editor page can close the sidebar. */
export const SIDEBAR_DRAG_START_EVENT = "sidebar-drag-start"

/**
 * Hook that attaches touch drag listeners via native addEventListener
 * with { passive: false } so we can call preventDefault() on touchmove
 * (required to prevent page scroll during drag).
 *
 * Also dispatches SIDEBAR_DRAG_START_EVENT so the editor can close the
 * sidebar on small screens, exposing the map for the drop.
 */
function useTouchDrag(
  ref: React.RefObject<HTMLDivElement | null>,
  dataKind: "device" | "infrastructure" | "socket",
  dataType: string,
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      // Notify the editor to close the sidebar so the map is accessible
      window.dispatchEvent(new CustomEvent(SIDEBAR_DRAG_START_EVENT))

      // Clone the element to use as a ghost that follows the finger
      const ghost = el.cloneNode(true) as HTMLElement
      ghost.style.cssText = `
        position: fixed;
        width: ${el.offsetWidth}px;
        left: ${touch.clientX - el.offsetWidth / 2}px;
        top: ${touch.clientY - el.offsetHeight / 2}px;
        pointer-events: none;
        opacity: 0;
        z-index: 9999;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        transition: opacity 0.15s ease, transform 0.15s ease;
        transform: scale(0.95);
      `
      document.body.appendChild(ghost)
      // Animate the ghost in on next frame
      requestAnimationFrame(() => {
        ghost.style.opacity = "0.9"
        ghost.style.transform = "scale(1.08)"
      })
      setTouchGhost(ghost)
      setTouchDragData({ kind: dataKind, type: dataType })
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault() // Must be non-passive to work
      const touch = e.touches[0]
      const ghost = getTouchGhost()
      if (ghost) {
        ghost.style.left = `${touch.clientX - el.offsetWidth / 2}px`
        ghost.style.top = `${touch.clientY - el.offsetHeight / 2}px`
      }
    }

    let ghostTimer: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      const ghost = getTouchGhost()
      if (ghost) {
        ghost.style.opacity = "0"
        ghost.style.transform = "scale(0.9)"
        ghostTimer = setTimeout(() => {
          if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
          ghostTimer = null
        }, 150)
        setTouchGhost(null)
      }
    }

    const onTouchEnd = () => {
      cleanup()
      // clearTouchDragData is called by map-events after processing the drop
    }

    const onTouchCancel = () => {
      cleanup()
      clearTouchDragData()
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd, { passive: true })
    el.addEventListener("touchcancel", onTouchCancel, { passive: true })

    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("touchcancel", onTouchCancel)
      if (ghostTimer !== null) clearTimeout(ghostTimer)
    }
  }, [ref, dataKind, dataType])
}

// ============================================
// DEVICE TYPES (Camera, Switch, NVR, Router, Access Point)
// ============================================
export enum DeviceType {
  CAMERA = "camera",
  SWITCH = "switch",
  NVR = "nvr",
  ROUTER = "router",
  ACCESS_POINT = "access_point",
  UPS = "ups",
  HORN_SPEAKER = "horn_speaker",
}

export const deviceIcons: Record<
  DeviceType,
  React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
> = {
  [DeviceType.CAMERA]: Video,
  [DeviceType.SWITCH]: Network,
  [DeviceType.NVR]: HardDrive,
  [DeviceType.ROUTER]: Router,
  [DeviceType.ACCESS_POINT]: Wifi,
  [DeviceType.UPS]: PcCase,
  [DeviceType.HORN_SPEAKER]: Volume2,
}

export const deviceLabels: Record<DeviceType, string> = {
  [DeviceType.CAMERA]: "Camera",
  [DeviceType.SWITCH]: "Switch",
  [DeviceType.NVR]: "NVR",
  [DeviceType.ROUTER]: "Router",
  [DeviceType.ACCESS_POINT]: "Access Point",
  [DeviceType.UPS]: "UPS",
  [DeviceType.HORN_SPEAKER]: "Horn Speaker",
}

export const deviceColors: Record<DeviceType, string> = {
  [DeviceType.CAMERA]: DEVICE_COLORS.camera,
  [DeviceType.SWITCH]: DEVICE_COLORS.switch,
  [DeviceType.NVR]: DEVICE_COLORS.nvr,
  [DeviceType.ROUTER]: DEVICE_COLORS.router,
  [DeviceType.ACCESS_POINT]: DEVICE_COLORS.access_point,
  [DeviceType.UPS]: DEVICE_COLORS.ups,
  [DeviceType.HORN_SPEAKER]: DEVICE_COLORS.horn_speaker,
}

// ============================================
// CAMERA SUBTYPES
// ============================================
export enum CameraSubtype {
  DOME = "dome",
  BULLET = "bullet",
  SPEED_DOME = "speed_dome",
  THERMAL = "thermal",
  FISHEYE = "fisheye",
  MOTORIZED_BULLET = "motorized_bullet",
}

export const cameraSubtypeIcons: Record<
  CameraSubtype,
  React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
> = {
  [CameraSubtype.DOME]: DomeCameraIcon,
  [CameraSubtype.BULLET]: BulletCameraIcon,
  [CameraSubtype.SPEED_DOME]: SpeedDomeCameraIcon,
  [CameraSubtype.THERMAL]: ThermalCameraIcon,
  [CameraSubtype.FISHEYE]: FisheyeCameraIcon,
  [CameraSubtype.MOTORIZED_BULLET]: MotorizedBulletCameraIcon,
}

export const cameraSubtypeLabels: Record<CameraSubtype, string> = {
  [CameraSubtype.DOME]: "Dome",
  [CameraSubtype.BULLET]: "Bullet",
  [CameraSubtype.SPEED_DOME]: "Speed Dome",
  [CameraSubtype.THERMAL]: "Thermal",
  [CameraSubtype.FISHEYE]: "Fisheye",
  [CameraSubtype.MOTORIZED_BULLET]: "Motorized Bullet",
}

// ============================================
// INFRASTRUCTURE TYPES (Rack Cabin, Workstation)
// ============================================
export enum InfrastructureType {
  RACK_CABIN = "rack_cabin",
  WORKSTATION = "workstation",
}

export const infrastructureIcons: Record<
  InfrastructureType,
  React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
> = {
  [InfrastructureType.RACK_CABIN]: Server,
  [InfrastructureType.WORKSTATION]: Monitor,
}

export const infrastructureLabels: Record<InfrastructureType, string> = {
  [InfrastructureType.RACK_CABIN]: "Rack Cabin",
  [InfrastructureType.WORKSTATION]: "Workstation",
}

export const infrastructureColors: Record<InfrastructureType, string> = {
  [InfrastructureType.RACK_CABIN]: INFRASTRUCTURE_COLORS.rack_cabin,
  [InfrastructureType.WORKSTATION]: INFRASTRUCTURE_COLORS.workstation,
}

// ============================================
// SOCKET TYPES (for Workstations)
// ============================================
export enum SocketType {
  UPS = "ups", // Red socket for UPS
  CAT6 = "cat6", // Data cable ending
  NORMAL = "normal", // White normal socket
}

export const socketIcons: Record<
  SocketType,
  React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
> = {
  [SocketType.UPS]: UPSOutletIcon,
  [SocketType.CAT6]: EthernetOutletIcon,
  [SocketType.NORMAL]: NormalOutletIcon,
}

export const socketLabels: Record<SocketType, string> = {
  [SocketType.UPS]: "UPS Socket",
  [SocketType.CAT6]: "CAT6 Socket",
  [SocketType.NORMAL]: "Normal Socket",
}

export const socketColors: Record<SocketType, string> = {
  [SocketType.UPS]: SOCKET_COLORS.ups,
  [SocketType.CAT6]: SOCKET_COLORS.cat6,
  [SocketType.NORMAL]: SOCKET_COLORS.normal,
}

// ============================================
// LEAFLET ICON CREATORS
// ============================================
export type LabelPosition = "top" | "bottom" | "left" | "right"

export const createLeafletIcon = (
  type: DeviceType,
  color?: string | null,
  isSelected?: boolean,
  rotation?: number,
  flipX?: boolean,
  flipY?: boolean,
  label?: string,
  ipAddress?: string | null,
  labelPosition?: LabelPosition,
  subtype?: string | null,
) => {
  const isCameraSubtype = type === DeviceType.CAMERA && subtype && subtype in cameraSubtypeIcons
  const IconComp = isCameraSubtype
    ? cameraSubtypeIcons[subtype as CameraSubtype]
    : (deviceIcons[type] ?? Video)
  const iconSize = isCameraSubtype ? 36 : 28
  const rotationDeg = rotation ?? 0
  const scaleX = flipX ? -1 : 1
  const scaleY = flipY ? -1 : 1
  const iconColor = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#000000"

  // Build transform string for icon only
  const transforms: string[] = []
  if (rotationDeg !== 0) transforms.push(`rotate(${rotationDeg}deg)`)
  if (scaleX !== 1 || scaleY !== 1) transforms.push(`scale(${scaleX}, ${scaleY})`)
  const transformStr = transforms.length > 0 ? transforms.join(" ") : undefined

  const effectiveLabelPosition = labelPosition || "bottom"

  let labelStyle: React.CSSProperties = {}
  let connectorLineStyle: React.CSSProperties | null = null
  if (label) {
    const iconHalfSize = 24 // half of 48px iconSize
    const lineLength = 20
    const labelGap = 2     // gap between connector end and label
    const sideOffset = iconHalfSize // distance from center to connector start (icon edge)
    switch (effectiveLabelPosition) {
      case "top":
        labelStyle = {
          position: "absolute",
          left: "50%",
          bottom: `calc(50% + ${iconHalfSize + lineLength + labelGap}px)`,
          transform: `translateX(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          left: "50%",
          bottom: `calc(50% + ${iconHalfSize}px)`,
          width: "1px",
          height: `${lineLength}px`,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateX(-50%)`,
        }
        break
      case "bottom":
        labelStyle = {
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${iconHalfSize + lineLength + labelGap}px)`,
          transform: `translateX(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${iconHalfSize}px)`,
          width: "1px",
          height: `${lineLength}px`,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateX(-50%)`,
        }
        break
      case "left":
        labelStyle = {
          position: "absolute",
          right: `calc(50% + ${sideOffset + lineLength + labelGap}px)`,
          top: "50%",
          transform: `translateY(-50%)`,
          whiteSpace: "nowrap",
          textAlign: "right",
        }
        connectorLineStyle = {
          position: "absolute",
          top: "50%",
          right: `calc(50% + ${sideOffset}px)`,
          width: `${lineLength}px`,
          height: "1px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateY(-50%)`,
        }
        break
      case "right":
        labelStyle = {
          position: "absolute",
          left: `calc(50% + ${sideOffset + lineLength + labelGap}px)`,
          top: "50%",
          transform: `translateY(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          top: "50%",
          left: `calc(50% + ${sideOffset}px)`,
          width: `${lineLength}px`,
          height: "1px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateY(-50%)`,
        }
        break
    }
  }

  const html = renderToStaticMarkup(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Icon container */}
      <div
        className="p-2 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          border: isSelected ? "3px solid #22c55e" : "3px solid transparent",
          boxShadow: isSelected ? "0 0 0 3px rgba(34, 197, 94, 0.3)" : "none",
          transform: transformStr,
        }}
      >
        <IconComp size={iconSize} style={{ color: iconColor }} />
      </div>
      {/* Connector line */}
      {label && connectorLineStyle && <div style={connectorLineStyle} />}
      {/* Component label with configurable positioning */}
      {label && (
        <div style={labelStyle}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#000000",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              padding: "1px 4px",
              borderRadius: "2px",
              lineHeight: 1.2,
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  )

  return L.divIcon({
    html,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })
}

export interface ChildDeviceInfo {
  type: DeviceType
  name: string
}

export interface ChildSocketInfo {
  type: SocketType
  name: string
}

export const createInfrastructureLeafletIcon = (
  type: InfrastructureType,
  color?: string | null,
  isSelected?: boolean,
  rotation?: number,
  flipX?: boolean,
  flipY?: boolean,
  label?: string,
  childDevices?: ChildDeviceInfo[],
  labelPosition?: LabelPosition
) => {
  const IconComp = infrastructureIcons[type] ?? Server
  const rotationDeg = rotation ?? 0
  const scaleX = flipX ? -1 : 1
  const scaleY = flipY ? -1 : 1
  const iconColor = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#000000"

  // Build transform string for icon only
  const transforms: string[] = []
  if (rotationDeg !== 0) transforms.push(`rotate(${rotationDeg}deg)`)
  if (scaleX !== 1 || scaleY !== 1) transforms.push(`scale(${scaleX}, ${scaleY})`)
  const transformStr = transforms.length > 0 ? transforms.join(" ") : undefined

  // Group child devices by type with count
  const childDeviceGroups = childDevices
    ? childDevices.reduce<Record<string, number>>((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1
        return acc
      }, {})
    : {}
  const groupedEntries = Object.entries(childDeviceGroups) as [DeviceType, number][]
  const hasChildren = childDevices && childDevices.length > 0

  const effectiveLabelPosition = labelPosition || "bottom"
  let labelStyle: React.CSSProperties = {}
  let connectorLineStyle: React.CSSProperties | null = null
  if (label) {
    const iconHalfSize = 24
    const lineLength = 20
    const labelGap = 4
    const sideOffset = iconHalfSize + 6
    switch (effectiveLabelPosition) {
      case "top":
        labelStyle = {
          position: "absolute",
          left: "50%",
          bottom: `calc(50% + ${iconHalfSize + lineLength + labelGap}px)`,
          transform: `translateX(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          left: "50%",
          bottom: `calc(50% + ${iconHalfSize}px)`,
          width: "1px",
          height: `${lineLength}px`,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateX(-50%)`,
        }
        break
      case "bottom":
        labelStyle = {
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${iconHalfSize + lineLength + labelGap}px)`,
          transform: `translateX(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${iconHalfSize}px)`,
          width: "1px",
          height: `${lineLength}px`,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateX(-50%)`,
        }
        break
      case "left":
        labelStyle = {
          position: "absolute",
          right: `calc(50% + ${sideOffset + lineLength + labelGap}px)`,
          top: "50%",
          transform: `translateY(-50%)`,
          whiteSpace: "nowrap",
          textAlign: "right",
        }
        connectorLineStyle = {
          position: "absolute",
          top: "50%",
          right: `calc(50% + ${sideOffset}px)`,
          width: `${lineLength}px`,
          height: "1px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateY(-50%)`,
        }
        break
      case "right":
        labelStyle = {
          position: "absolute",
          left: `calc(50% + ${sideOffset + lineLength + labelGap}px)`,
          top: "50%",
          transform: `translateY(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          top: "50%",
          left: `calc(50% + ${sideOffset}px)`,
          width: `${lineLength}px`,
          height: "1px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateY(-50%)`,
        }
        break
    }
  }

  const html = renderToStaticMarkup(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Icon container */}
      <div
        className="p-2 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          border: isSelected ? "3px solid #22c55e" : "3px solid transparent",
          boxShadow: isSelected ? "0 0 0 3px rgba(34, 197, 94, 0.3)" : "none",
          transform: transformStr,
        }}
      >
        <IconComp size={28} style={{ color: iconColor }} />
      </div>
      {/* Child device icons stacked vertically with multiplier badges */}
      {hasChildren && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "100%",
            transform: "translateY(-50%)",
            marginLeft: "6px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "4px 6px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            gap: "3px",
          }}
          title={childDevices!.map(d => d.name).join(", ")}
        >
          {groupedEntries.map(([deviceType, count], index) => {
            const ChildIcon = deviceIcons[deviceType]
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <ChildIcon
                  size={18}
                  style={{
                    color: deviceColors[deviceType],
                  }}
                />
                <div
                    style={{
                      minWidth: "18px",
                      height: "16px",
                      backgroundColor: deviceColors[deviceType],
                      color: "#ffffff",
                      fontSize: "9px",
                      fontWeight: 700,
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      lineHeight: 1,
                    }}
                  >
                    x{count}
                  </div>
              </div>
            )
          })}
        </div>
      )}
      {/* Connector line */}
      {label && connectorLineStyle && <div style={connectorLineStyle} />}
      {/* Infrastructure label with configurable positioning */}
      {label && (
        <div style={labelStyle}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#000000",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              padding: "1px 4px",
              borderRadius: "2px",
              lineHeight: 1.2,
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  )

  return L.divIcon({
    html,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })
}


export const createSocketLeafletIcon = (
  type: SocketType,
  color?: string | null,
  isSelected?: boolean,
  rotation?: number,
  flipX?: boolean,
  flipY?: boolean,
  label?: string,
  labelPosition?: LabelPosition
) => {
  const IconComp = socketIcons[type] ?? Plug
  const rotationDeg = rotation ?? 0
  const scaleX = flipX ? -1 : 1
  const scaleY = flipY ? -1 : 1
  const iconColor = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : socketColors[type]

  // Build transform string for icon only
  const transforms: string[] = []
  if (rotationDeg !== 0) transforms.push(`rotate(${rotationDeg}deg)`)
  if (scaleX !== 1 || scaleY !== 1) transforms.push(`scale(${scaleX}, ${scaleY})`)
  const transformStr = transforms.length > 0 ? transforms.join(" ") : undefined

  const effectiveLabelPosition = labelPosition || "bottom"
  let labelStyle: React.CSSProperties = {}
  let connectorLineStyle: React.CSSProperties | null = null
  if (label) {
    const iconHalfSize = 20 // half of 40px iconSize
    const lineLength = 20
    const labelGap = 2
    const sideOffset = iconHalfSize
    switch (effectiveLabelPosition) {
      case "top":
        labelStyle = {
          position: "absolute",
          left: "50%",
          bottom: `calc(50% + ${iconHalfSize + lineLength + labelGap}px)`,
          transform: `translateX(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          left: "50%",
          bottom: `calc(50% + ${iconHalfSize}px)`,
          width: "1px",
          height: `${lineLength}px`,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateX(-50%)`,
        }
        break
      case "bottom":
        labelStyle = {
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${iconHalfSize + lineLength + labelGap}px)`,
          transform: `translateX(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${iconHalfSize}px)`,
          width: "1px",
          height: `${lineLength}px`,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateX(-50%)`,
        }
        break
      case "left":
        labelStyle = {
          position: "absolute",
          right: `calc(50% + ${sideOffset + lineLength + labelGap}px)`,
          top: "50%",
          transform: `translateY(-50%)`,
          whiteSpace: "nowrap",
          textAlign: "right",
        }
        connectorLineStyle = {
          position: "absolute",
          top: "50%",
          right: `calc(50% + ${sideOffset}px)`,
          width: `${lineLength}px`,
          height: "1px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateY(-50%)`,
        }
        break
      case "right":
        labelStyle = {
          position: "absolute",
          left: `calc(50% + ${sideOffset + lineLength + labelGap}px)`,
          top: "50%",
          transform: `translateY(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          top: "50%",
          left: `calc(50% + ${sideOffset}px)`,
          width: `${lineLength}px`,
          height: "1px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateY(-50%)`,
        }
        break
    }
  }

  const html = renderToStaticMarkup(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Icon container */}
      <div
        className="p-2 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          border: isSelected ? "3px solid #22c55e" : "3px solid transparent",
          boxShadow: isSelected ? "0 0 0 3px rgba(34, 197, 94, 0.3)" : "none",
          transform: transformStr,
        }}
      >
        <IconComp size={24} style={{ color: iconColor }} />
      </div>
      {/* Connector line */}
      {label && connectorLineStyle && <div style={connectorLineStyle} />}
      {/* Socket label with configurable positioning */}
      {label && (
        <div style={labelStyle}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#000000",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              padding: "1px 4px",
              borderRadius: "2px",
              lineHeight: 1.2,
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  )

  return L.divIcon({
    html,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

export const createInfrastructureLeafletIconForWorkstation = (
  type: InfrastructureType,
  color?: string | null,
  isSelected?: boolean,
  rotation?: number,
  flipX?: boolean,
  flipY?: boolean,
  label?: string,
  childSockets?: ChildSocketInfo[],
  labelPosition?: LabelPosition
) => {
  const IconComp = infrastructureIcons[type] ?? Server
  const rotationDeg = rotation ?? 0
  const scaleX = flipX ? -1 : 1
  const scaleY = flipY ? -1 : 1
  const iconColor = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#000000"

  // Build transform string for icon only
  const transforms: string[] = []
  if (rotationDeg !== 0) transforms.push(`rotate(${rotationDeg}deg)`)
  if (scaleX !== 1 || scaleY !== 1) transforms.push(`scale(${scaleX}, ${scaleY})`)
  const transformStr = transforms.length > 0 ? transforms.join(" ") : undefined

  // Group child sockets by type with count
  const childSocketGroups = childSockets
    ? childSockets.reduce<Record<string, number>>((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1
        return acc
      }, {})
    : {}
  const groupedSocketEntries = Object.entries(childSocketGroups) as [SocketType, number][]
  const hasChildren = childSockets && childSockets.length > 0

  const effectiveLabelPosition = labelPosition || "bottom"
  let labelStyle: React.CSSProperties = {}
  let connectorLineStyle: React.CSSProperties | null = null
  if (label) {
    const iconHalfSize = 24
    const lineLength = 20
    const labelGap = 4
    const sideOffset = iconHalfSize + 6
    switch (effectiveLabelPosition) {
      case "top":
        labelStyle = {
          position: "absolute",
          left: "50%",
          bottom: `calc(50% + ${iconHalfSize + lineLength + labelGap}px)`,
          transform: `translateX(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          left: "50%",
          bottom: `calc(50% + ${iconHalfSize}px)`,
          width: "1px",
          height: `${lineLength}px`,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateX(-50%)`,
        }
        break
      case "bottom":
        labelStyle = {
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${iconHalfSize + lineLength + labelGap}px)`,
          transform: `translateX(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${iconHalfSize}px)`,
          width: "1px",
          height: `${lineLength}px`,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateX(-50%)`,
        }
        break
      case "left":
        labelStyle = {
          position: "absolute",
          right: `calc(50% + ${sideOffset + lineLength + labelGap}px)`,
          top: "50%",
          transform: `translateY(-50%)`,
          whiteSpace: "nowrap",
          textAlign: "right",
        }
        connectorLineStyle = {
          position: "absolute",
          top: "50%",
          right: `calc(50% + ${sideOffset}px)`,
          width: `${lineLength}px`,
          height: "1px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateY(-50%)`,
        }
        break
      case "right":
        labelStyle = {
          position: "absolute",
          left: `calc(50% + ${sideOffset + lineLength + labelGap}px)`,
          top: "50%",
          transform: `translateY(-50%)`,
          whiteSpace: "nowrap",
        }
        connectorLineStyle = {
          position: "absolute",
          top: "50%",
          left: `calc(50% + ${sideOffset}px)`,
          width: `${lineLength}px`,
          height: "1px",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          transform: `translateY(-50%)`,
        }
        break
    }
  }

  const html = renderToStaticMarkup(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Icon container */}
      <div
        className="p-2 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          border: isSelected ? "3px solid #22c55e" : "3px solid transparent",
          boxShadow: isSelected ? "0 0 0 3px rgba(34, 197, 94, 0.3)" : "none",
          transform: transformStr,
        }}
      >
        <IconComp size={28} style={{ color: iconColor }} />
      </div>
      {/* Child socket icons stacked vertically with multiplier badges */}
      {hasChildren && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "100%",
            transform: "translateY(-50%)",
            marginLeft: "6px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "4px 6px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            gap: "3px",
          }}
          title={childSockets!.map(s => s.name).join(", ")}
        >
          {groupedSocketEntries.map(([socketType, count], index) => {
            const ChildIcon = socketIcons[socketType]
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <ChildIcon
                  size={18}
                  style={{
                    color: socketColors[socketType],
                  }}
                />
                <div
                    style={{
                      minWidth: "18px",
                      height: "16px",
                      backgroundColor: socketColors[socketType],
                      color: "#ffffff",
                      fontSize: "9px",
                      fontWeight: 700,
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      lineHeight: 1,
                    }}
                  >
                    x{count}
                  </div>
              </div>
            )
          })}
        </div>
      )}
      {/* Connector line */}
      {label && connectorLineStyle && <div style={connectorLineStyle} />}
      {/* Workstation label with configurable positioning */}
      {label && (
        <div style={labelStyle}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#000000",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              padding: "1px 4px",
              borderRadius: "2px",
              lineHeight: 1.2,
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  )

  return L.divIcon({
    html,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })
}

// ============================================
// DRAGGABLE COMPONENTS FOR SIDEBAR
// ============================================
// i18n key maps for palette labels — resolved via useTranslation inside each
// draggable. Kept here (not in a shared hook) to avoid a circular import.
const DEVICE_LABEL_KEYS: Record<DeviceType, string> = {
  [DeviceType.CAMERA]: "types.deviceCamera",
  [DeviceType.SWITCH]: "types.deviceSwitch",
  [DeviceType.NVR]: "types.deviceNvr",
  [DeviceType.ROUTER]: "types.deviceRouter",
  [DeviceType.ACCESS_POINT]: "types.deviceAccessPoint",
  [DeviceType.UPS]: "types.deviceUps",
  [DeviceType.HORN_SPEAKER]: "types.deviceHornSpeaker",
}
const INFRA_LABEL_KEYS: Record<InfrastructureType, string> = {
  [InfrastructureType.RACK_CABIN]: "types.infraRackCabin",
  [InfrastructureType.WORKSTATION]: "types.infraWorkstation",
}
const SOCKET_LABEL_KEYS: Record<SocketType, string> = {
  [SocketType.UPS]: "types.socketUps",
  [SocketType.CAT6]: "types.socketCat6",
  [SocketType.NORMAL]: "types.socketNormal",
}

interface DraggableDeviceProps {
  type: DeviceType
  label?: string
  className?: string
}

export const DraggableDevice: React.FC<DraggableDeviceProps> = ({
  type,
  label,
  className,
}) => {
  const { t } = useTranslation()
  const deviceLabel = t(DEVICE_LABEL_KEYS[type])
  const IconComp = deviceIcons[type] ?? Video
  const color = deviceColors[type]
  const ref = useRef<HTMLDivElement>(null)
  useTouchDrag(ref, "device", type)

  return (
    <div
      ref={ref}
      draggable
      onDragStart={(e) => {
        e.dataTransfer?.setData("deviceType", type)
        window.dispatchEvent(new CustomEvent(SIDEBAR_DRAG_START_EVENT))
      }}
      aria-label={label ?? deviceLabel}
      title={deviceLabel}
      className={`p-3 mb-2 bg-card rounded cursor-move hover:bg-accent border border-border flex flex-col items-center justify-center gap-1 select-none ${className ?? ""}`}
    >
      <IconComp size={20} style={{ color }} />
      <span className="text-xs text-muted-foreground">{deviceLabel}</span>
    </div>
  )
}

interface DraggableInfrastructureProps {
  type: InfrastructureType
  label?: string
  className?: string
}

export const DraggableInfrastructure: React.FC<DraggableInfrastructureProps> = ({
  type,
  label,
  className,
}) => {
  const { t } = useTranslation()
  const infraLabel = t(INFRA_LABEL_KEYS[type])
  const IconComp = infrastructureIcons[type] ?? Server
  const color = infrastructureColors[type]
  const ref = useRef<HTMLDivElement>(null)
  useTouchDrag(ref, "infrastructure", type)

  return (
    <div
      ref={ref}
      draggable
      onDragStart={(e) => {
        e.dataTransfer?.setData("infrastructureType", type)
        window.dispatchEvent(new CustomEvent(SIDEBAR_DRAG_START_EVENT))
      }}
      aria-label={label ?? infraLabel}
      title={infraLabel}
      className={`p-3 mb-2 bg-card rounded cursor-move hover:bg-accent border border-border flex flex-col items-center justify-center gap-1 select-none ${className ?? ""}`}
    >
      <IconComp size={20} style={{ color }} />
      <span className="text-xs text-muted-foreground">{infraLabel}</span>
    </div>
  )
}

interface DraggableSocketProps {
  type: SocketType
  label?: string
  className?: string
}

export const DraggableSocket: React.FC<DraggableSocketProps> = ({
  type,
  label,
  className,
}) => {
  const { t } = useTranslation()
  const socketLabel = t(SOCKET_LABEL_KEYS[type])
  const IconComp = socketIcons[type] ?? Video
  const color = socketColors[type]
  const ref = useRef<HTMLDivElement>(null)
  useTouchDrag(ref, "socket", type)

  return (
    <div
      ref={ref}
      draggable
      onDragStart={(e) => {
        e.dataTransfer?.setData("socketType", type)
        window.dispatchEvent(new CustomEvent(SIDEBAR_DRAG_START_EVENT))
      }}
      aria-label={label ?? socketLabel}
      title={socketLabel}
      className={`p-3 mb-2 bg-card rounded cursor-move hover:bg-accent border border-border flex flex-col items-center justify-center gap-1 select-none ${className ?? ""}`}
    >
      <IconComp size={20} style={{ color }} />
      <span className="text-xs text-muted-foreground">{socketLabel}</span>
    </div>
  )
}
