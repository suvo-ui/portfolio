import { createContext, useContext, useState, type ReactNode } from "react";

type TabName = "gallery" | "print";

interface TabSelectionContextValue {
  selectedTab: TabName;
  setSelectedTab: (tab: TabName) => void;
}

const TabSelectionContext = createContext<TabSelectionContextValue | undefined>(
  undefined,
);

export function TabSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedTab, setSelectedTab] = useState<TabName>("gallery");

  return (
    <TabSelectionContext.Provider value={{ selectedTab, setSelectedTab }}>
      {children}
    </TabSelectionContext.Provider>
  );
}

export function useTabSelection() {
  const context = useContext(TabSelectionContext);
  if (!context) {
    throw new Error("useTabSelection must be used within TabSelectionProvider");
  }
  return context;
}
