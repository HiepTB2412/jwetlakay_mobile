import { createContext, use, useMemo, useState, type ReactNode } from "react";

// Web Redux `visibleDrawer` (spec Phần B §0.11): the header's menu button opens the drawer.

type DrawerContextValue = { visible: boolean; open: () => void; close: () => void };

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const value = useMemo<DrawerContextValue>(
    () => ({ visible, open: () => setVisible(true), close: () => setVisible(false) }),
    [visible],
  );
  return <DrawerContext value={value}>{children}</DrawerContext>;
}

export function useDrawer() {
  const context = use(DrawerContext);
  if (!context) throw new Error("useDrawer must be used inside DrawerProvider");
  return context;
}
