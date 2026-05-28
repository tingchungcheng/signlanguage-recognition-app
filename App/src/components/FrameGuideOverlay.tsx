import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

/** Static framing guide when live hand joints are unavailable (Expo Go on device). */
export function FrameGuideOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Rect
          x="14%"
          y="22%"
          width="72%"
          height="52%"
          stroke="#FF6D1F"
          strokeWidth={2}
          fill="none"
          strokeDasharray="8 6"
        />
      </Svg>
    </View>
  );
}
