import Constants from "expo-constants";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

/**
 * Expo Go cannot load native TFLite / Vision Camera frame processors.
 * Realtime recognition runs in a development build (see README).
 */
function DevBuildRequiredScreen() {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Realtime mode needs a dev build</Text>
      <Text style={styles.body}>
        Expo Go is too slow for live sign recognition. Build and install the native app once,
        then use the dev client for fast camera + TFLite inference (~10–15 fps).
      </Text>
      <Text style={styles.code}>npm run android</Text>
      <Text style={styles.code}>npm run ios</Text>
      <Text style={styles.hint}>
        First time: installs the app on your phone/emulator. After that, run npm start and open
        the dev client (not Expo Go).
      </Text>
    </View>
  );
}

export function HandTrackingScreen() {
  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    return <DevBuildRequiredScreen />;
  }

  const { RealtimeHandTrackingScreen } =
    require("./RealtimeHandTrackingScreen") as typeof import("./RealtimeHandTrackingScreen");
  return <RealtimeHandTrackingScreen />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  code: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});
