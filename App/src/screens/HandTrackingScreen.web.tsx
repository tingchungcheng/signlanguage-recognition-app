import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export function HandTrackingScreen() {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Realtime recognition on device</Text>
      <Text style={styles.body}>
        Install the development build on Android or iOS for live camera inference. Web preview
        uses the slower TensorFlow.js path only.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 12 },
  body: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22 },
});
