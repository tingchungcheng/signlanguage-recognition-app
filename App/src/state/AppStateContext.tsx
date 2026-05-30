import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { ModelStatus } from "../types/recognition";

type AppStateContextValue = {
  modelStatus: ModelStatus;
  setModelStatus: (status: ModelStatus) => void;
  modelError: string | null;
  setModelError: (message: string | null) => void;
  predictedLetter: string | null;
  setPredictedLetter: (letter: string | null) => void;
  confidence: number | null;
  setConfidence: (value: number | null) => void;
  word: string;
  appendToWord: (text: string) => void;
  clearWord: () => void;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AppStateProvider({ children }: Props) {
  const [modelStatus, setModelStatus] = useState<ModelStatus>("loading");
  const [modelError, setModelError] = useState<string | null>(null);
  const [predictedLetter, setPredictedLetter] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [word, setWord] = useState("");

  const appendToWord = useCallback((text: string) => {
    if (!text) {
      return;
    }
    setWord((prev) => prev + text);
  }, []);

  const clearWord = useCallback(() => {
    setWord("");
  }, []);

  const value = useMemo(
    () => ({
      modelStatus,
      setModelStatus,
      modelError,
      setModelError,
      predictedLetter,
      setPredictedLetter,
      confidence,
      setConfidence,
      word,
      appendToWord,
      clearWord,
    }),
    [
      modelStatus,
      modelError,
      predictedLetter,
      confidence,
      word,
      appendToWord,
      clearWord,
    ],
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
