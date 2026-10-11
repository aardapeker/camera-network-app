import { HexColorPicker } from "react-colorful";
import { Palette } from "lucide-react";
import { COLOR_FALLBACK_HEX } from "~/constants/colors";

const DEFAULT_COLOR = COLOR_FALLBACK_HEX;

interface ColorPickerMenuSectionProps {
  /** Current color (hex). When null/undefined, picker shows DEFAULT_COLOR. */
  color: string | null | undefined;
  /** Called when user selects a new color (hex string) or null when cleared. */
  onColorChange: (color: string | null) => void;
}

export function ColorPickerMenuSection({
  color,
  onColorChange,
}: ColorPickerMenuSectionProps) {
  const displayColor = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : DEFAULT_COLOR;

  return (
    <>
      <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-1.5">
        <Palette className="h-3.5 w-3.5" />
        <span>Color</span>
      </div>
      <div className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
        <HexColorPicker
          color={displayColor}
          onChange={(hex) => onColorChange(hex)}
          style={{ width: "100%", height: 100 }}
          className="rounded border border-border"
        />
        <div className="flex items-center gap-2 mt-2">
          <div
            className="w-6 h-6 rounded border border-border shrink-0"
            style={{ backgroundColor: displayColor }}
            title={displayColor}
          />
          <span className="text-xs text-muted-foreground font-mono flex-1 truncate">
            {displayColor}
          </span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground underline"
            onClick={() => onColorChange(null)}
          >
            Clear
          </button>
        </div>
      </div>
    </>
  );
}
