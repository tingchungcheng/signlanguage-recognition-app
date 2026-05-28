import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { HandLandmarks } from "../types/landmarks";

type Props = {
  landmarks: HandLandmarks | null;
};

export function LandmarkOverlay({ landmarks }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        {landmarks?.map((point, index) => (
          <Circle
            key={`${index}-${point.x.toFixed(3)}-${point.y.toFixed(3)}`}
            cx={`${Math.min(Math.max(point.x, 0), 1) * 100}%`}
            cy={`${Math.min(Math.max(point.y, 0), 1) * 100}%`}
            r={4}
            fill="#FF6D1F"
          />
        ))}
      </Svg>
    </View>
  );
}
