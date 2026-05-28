import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { HandLandmarks } from "../types/landmarks";

type AppStateContextValue = {
  landmarks: HandLandmarks | null;
  setLandmarks: (landmarks: HandLandmarks | null) => void;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AppStateProvider({ children }: Props) {
  const [landmarks, setLandmarks] = useState<HandLandmarks | null>(null);

  const value = useMemo(
    () => ({
      landmarks,
      setLandmarks,
    }),
    [landmarks],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}
