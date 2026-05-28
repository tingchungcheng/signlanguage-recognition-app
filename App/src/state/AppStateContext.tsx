import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { HandLandmarks } from "../types/landmarks";
import { ModelStatus } from "../types/recognition";

type AppStateContextValue = {
  landmarks: HandLandmarks | null;
  setLandmarks: (landmarks: HandLandmarks | null) => void;
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
  const [landmarks, setLandmarks] = useState<HandLandmarks | null>(null);
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
      landmarks,
      setLandmarks,
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
      landmarks,
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
