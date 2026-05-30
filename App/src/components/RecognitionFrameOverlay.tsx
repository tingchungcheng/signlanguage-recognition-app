import type { HandLandmark } from "expo-vision-camera-v4-mediapipe";
import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { colors } from "../theme/colors";
import { HAND_CONNECTIONS, type NormalizedRect } from "../utils/handBounds";

const CONFIDENT_THRESHOLD = 0.12;

type Props = {
  /** Hand bounding box in normalized coordinates; null when no hand detected. */
  trackRect: NormalizedRect | null;
  landmarks: HandLandmark[] | null;
  predictedLetter: string | null;
  confidence: number | null;
  modelReady: boolean;
  handTrackError?: string | null;
  handScans?: number;
};

function pctSvg(value: number): string {
  return `${value * 100}%`;
}

function pctView(value: number): ViewStyle["left"] {
  return `${value * 100}%` as ViewStyle["left"];
}

/**
 * Dynamic frame around the tracked hand + letter/confidence to the right.
 */
export function RecognitionFrameOverlay({
  trackRect,
  landmarks,
  predictedLetter,
  confidence,
  modelReady,
  handTrackError = null,
  handScans = 0,
}: Props) {
  const confident =
    modelReady && confidence != null && confidence >= CONFIDENT_THRESHOLD && predictedLetter != null;
  const letter = modelReady ? (predictedLetter ?? "—") : "…";
  const confidenceText =
    confidence != null ? `${Math.round(confidence * 100)}%` : modelReady ? "—" : "…";

  if (trackRect == null) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            {handTrackError
              ? `Hand tracking error: ${handTrackError}`
              : handScans > 0
                ? "Hold one hand clearly in front of the camera"
                : "Show your hand to the camera"}
          </Text>
        </View>
      </View>
    );
  }

  const frameLeft = pctSvg(trackRect.x);
  const frameTop = pctSvg(trackRect.y);
  const frameWidth = pctSvg(trackRect.width);
  const frameHeight = pctSvg(trackRect.height);
  const labelLeft = pctView(trackRect.x + trackRect.width);
  const labelTop = pctView(trackRect.y);
  const labelHeight = pctView(trackRect.height);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        {landmarks != null
          ? HAND_CONNECTIONS.map(([from, to]) => {
              const a = landmarks[from];
              const b = landmarks[to];
              if (!a || !b) {
                return null;
              }
              return (
                <Line
                  key={`${from}-${to}`}
                  x1={pctSvg(a.x)}
                  y1={pctSvg(a.y)}
                  x2={pctSvg(b.x)}
                  y2={pctSvg(b.y)}
                  stroke={colors.accent}
                  strokeWidth={2}
                  opacity={0.85}
                />
              );
            })
          : null}
        {landmarks?.map((point, index) => (
          <Circle
            key={`lm-${index}`}
            cx={pctSvg(point.x)}
            cy={pctSvg(point.y)}
            r={4}
            fill={colors.accent}
            stroke={colors.textPrimary}
            strokeWidth={1}
          />
        ))}
        <Rect
          x={frameLeft}
          y={frameTop}
          width={frameWidth}
          height={frameHeight}
          rx={12}
          ry={12}
          stroke={confident ? colors.accent : "rgba(255, 109, 31, 0.7)"}
          strokeWidth={confident ? 3 : 2}
          strokeDasharray={confident ? undefined : "8 6"}
          fill="rgba(255, 109, 31, 0.06)"
        />
      </Svg>

      <View
        style={[
          styles.labelColumn,
          {
            left: labelLeft,
            top: labelTop,
            height: labelHeight,
          },
        ]}
      >
        <Text style={[styles.letter, !confident && styles.letterMuted]}>{letter}</Text>
        <Text style={styles.confidenceLabel}>Confidence</Text>
        <Text style={[styles.confidenceValue, confident && styles.confidenceValueActive]}>
          {confidenceText}
        </Text>
        {!confident && modelReady ? (
          <Text style={styles.trackingHint}>Hold sign steady</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hintBox: {
    position: "absolute",
    left: "10%",
    right: "10%",
    top: "42%",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(34, 34, 34, 0.75)",
    alignItems: "center",
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  labelColumn: {
    position: "absolute",
    marginLeft: 10,
    justifyContent: "center",
    minWidth: 88,
    maxWidth: 120,
  },
  letter: {
    color: colors.accent,
    fontSize: 52,
    fontWeight: "800",
    lineHeight: 56,
  },
  letterMuted: {
    color: colors.textMuted,
  },
  confidenceLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  confidenceValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  confidenceValueActive: {
    color: colors.accent,
  },
  trackingHint: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 11,
  },
});
