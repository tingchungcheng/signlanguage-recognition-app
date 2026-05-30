import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { ModelStatus } from "../types/recognition";

type Props = {
  modelStatus: ModelStatus;
  modelError: string | null;
  framesClassified?: number;
  fps?: number;
  /** MediaPipe scans (independent of letter classification). */
  handScans?: number;
  handDetected?: boolean;
  predictedLetter: string | null;
  word: string;
  onAddLetter: () => void;
  onSpace: () => void;
  onClear: () => void;
  onSpeak: () => void;
};

export function RecognitionPanel({
  modelStatus,
  modelError,
  framesClassified = 0,
  fps = 0,
  handScans = 0,
  handDetected = false,
  predictedLetter,
  word,
  onAddLetter,
  onSpace,
  onClear,
  onSpeak,
}: Props) {
  const canAdd = predictedLetter != null && modelStatus === "ready";
  const canSpeak = word.trim().length > 0;

  return (
    <View style={styles.panel}>
      <Text style={styles.metaLabel}>Model</Text>
      <Text style={styles.metaValue}>{modelStatus}</Text>

      <Text style={styles.wordLabel}>Word</Text>
      <Text style={styles.wordValue}>{word.length > 0 ? word : "(empty)"}</Text>

      <Text style={styles.metaLabel}>Hand tracking</Text>
      <Text style={styles.metaValue}>
        {handDetected
          ? "hand detected"
          : handScans > 0
            ? "scanning — hold one hand in frame"
            : modelStatus === "ready"
              ? "starting scanner…"
              : "waiting for model"}
      </Text>

      <Text style={styles.metaLabel}>Classifier</Text>
      <Text style={styles.metaValue}>
        {framesClassified > 0
          ? `${fps > 0 ? `${fps} fps` : "running"} · ${framesClassified} frames`
          : handDetected
            ? "classifying…"
            : modelStatus === "ready"
              ? "waiting for hand"
              : "—"}
      </Text>

      {modelError ? <Text style={styles.error}>{modelError}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, !canAdd && styles.buttonDisabled]}
          onPress={onAddLetter}
          disabled={!canAdd}
        >
          <Text style={styles.buttonText}>Add letter</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onSpace}>
          <Text style={styles.buttonText}>Space</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={onClear}>
          <Text style={styles.buttonText}>Clear</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.speakButton, !canSpeak && styles.buttonDisabled]}
          onPress={onSpeak}
          disabled={!canSpeak}
        >
          <Text style={styles.buttonText}>Speak</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(34,34,34,0.92)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  metaValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  wordLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  wordValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    minHeight: 28,
  },
  error: {
    color: "#ffb4a2",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  speakButton: {
    backgroundColor: colors.accent,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
});
