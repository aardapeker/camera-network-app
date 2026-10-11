import { useEffect, useState, useRef, type ReactNode } from "react";
import { useMap } from "react-leaflet";
import { createPortal } from "react-dom";

interface SmartPopupProps {
  lat: number;
  lng: number;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Smart Popup component that adjusts position based on marker location.
 * Opens upward when marker is near the bottom of the map, downward when near the top.
 * Uses createPortal to render outside the map container for proper z-index handling.
 */
export function SmartPopup({
  lat,
  lng,
  children,
  isOpen,
  onClose,
}: SmartPopupProps) {
  const map = useMap();
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    x: number;
    y: number;
    openUpward: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      try {
        const containerPoint = map.latLngToContainerPoint([lat, lng]);
        const containerRect = map.getContainer().getBoundingClientRect();
        const mapHeight = containerRect.height;
        const isNearTop = containerPoint.y < mapHeight * 0.3;
        setPosition({
          x: containerRect.left + containerPoint.x,
          y: containerRect.top + containerPoint.y,
          openUpward: !isNearTop,
        });
      } catch {
        // Map may be mid-destroy (e.g. key change remounting MapContainer)
      }
    };

    updatePosition();

    // Update position on map move/zoom
    map.on("move", updatePosition);
    map.on("zoom", updatePosition);

    return () => {
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [isOpen, lat, lng, map]);

  // Adjust position after popup renders to account for its size
  useEffect(() => {
    if (position && popupRef.current) {
      const popup = popupRef.current;
      const popupRect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 8;

      let adjustedX = position.x - popupRect.width / 2;
      let adjustedY = position.openUpward
        ? position.y - popupRect.height - 40 // 40px offset for icon height
        : position.y + 40;

      // Keep within horizontal bounds
      if (adjustedX < padding) {
        adjustedX = padding;
      } else if (adjustedX + popupRect.width > viewportWidth - padding) {
        adjustedX = viewportWidth - popupRect.width - padding;
      }

      // Keep within vertical bounds
      if (adjustedY < padding) {
        adjustedY = padding;
      } else if (adjustedY + popupRect.height > viewportHeight - padding) {
        adjustedY = viewportHeight - popupRect.height - padding;
      }

      popup.style.left = `${adjustedX}px`;
      popup.style.top = `${adjustedY}px`;
      popup.style.visibility = "visible";
    }
  }, [position]);

  if (!isOpen || !position) return null;

  return createPortal(
    <>
      {/* Backdrop to close popup when clicking outside */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        ref={popupRef}
        className="fixed z-[9999] bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-3"
        style={{
          left: position.x,
          top: position.y,
          visibility: "hidden", // Will be set to visible after position adjustment
          transform: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow/pointer */}
        <div
          className={`absolute w-3 h-3 bg-popover border-border rotate-45 left-1/2 -ml-1.5 ${
            position.openUpward
              ? "bottom-[-6px] border-r border-b"
              : "top-[-6px] border-l border-t"
          }`}
        />
        {children}
      </div>
    </>,
    document.body,
  );
}
