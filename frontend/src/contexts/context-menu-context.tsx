import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ContextMenuState {
  id: string | null;
  position: { x: number; y: number } | null;
}

interface ContextMenuContextType {
  openMenuId: string | null;
  menuPosition: { x: number; y: number } | null;
  openContextMenu: (id: string, position: { x: number; y: number }) => void;
  closeContextMenu: (id?: string) => void;
  isMenuOpen: (id: string) => boolean;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    id: null,
    position: null,
  });

  const openContextMenu = useCallback((id: string, position: { x: number; y: number }) => {
    setMenuState({ id, position });
  }, []);

  const closeContextMenu = useCallback((id?: string) => {
    setMenuState((prev) => {
      // If specific id provided, only close if it matches
      if (id && prev.id !== id) return prev;
      return { id: null, position: null };
    });
  }, []);

  const isMenuOpen = useCallback((id: string) => {
    return menuState.id === id;
  }, [menuState.id]);

  return (
    <ContextMenuContext.Provider
      value={{
        openMenuId: menuState.id,
        menuPosition: menuState.position,
        openContextMenu,
        closeContextMenu,
        isMenuOpen,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error("useContextMenu must be used within a ContextMenuProvider");
  }
  return context;
}
