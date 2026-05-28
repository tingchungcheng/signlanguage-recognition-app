import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { HAND_CONNECTIONS } from "../constants/handConnections";
import { HandLandmarks } from "../types/landmarks";

type Props = {
  landmarks: HandLandmarks | null;
};

function toPercent(value: number): string {
  return `${Math.min(Math.max(value, 0), 1) * 100}%`;
}

export function LandmarkOverlay({ landmarks }: Props) {
  if (!landmarks || landmarks.length < 5) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        {HAND_CONNECTIONS.map(([from, to]) => {
          const a = landmarks[from];
          const b = landmarks[to];
          if (!a || !b) {
            return null;
          }
          return (
            <Line
              key={`${from}-${to}`}
              x1={toPercent(a.x)}
              y1={toPercent(a.y)}
              x2={toPercent(b.x)}
              y2={toPercent(b.y)}
              stroke="#FF6D1F"
              strokeWidth={2}
            />
          );
        })}
        {landmarks.map((point, index) => (
          <Circle
            key={`joint-${index}`}
            cx={toPercent(point.x)}
            cy={toPercent(point.y)}
            r={index === 0 ? 6 : 4}
            fill={index === 0 ? "#FFD166" : "#FF6D1F"}
          />
        ))}
      </Svg>
    </View>
  );
}
