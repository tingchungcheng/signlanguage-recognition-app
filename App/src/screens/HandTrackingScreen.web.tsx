import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

/** Native dev build only; web is not a supported target. */
export function HandTrackingScreen() {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Use a native dev build</Text>
      <Text style={styles.body}>
        Realtime camera + TFLite runs on Android or iOS via the Expo development client. See
        docs/app.md for npm run android:dev or ios:dev.
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
