import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LandmarkOverlay } from "../components/LandmarkOverlay";
import { handDetectionService } from "../services/handDetectionService";
import { useAppState } from "../state/AppStateContext";
import { colors } from "../theme/colors";

export function HandTrackingScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { landmarks, setLandmarks } = useAppState();

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const start = async () => {
      await handDetectionService.initialize();

      intervalId = setInterval(async () => {
        if (!isMounted) {
          return;
        }

        const detected = await handDetectionService.detect();
        setLandmarks(detected);
      }, 120);
    };

    void start();

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [setLandmarks]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.primaryText}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.primaryText}>Camera permission is required for hand tracking.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" />
      <LandmarkOverlay landmarks={landmarks} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Sign A-Z (Step 1)</Text>
        <Text style={styles.subtitle}>
          {landmarks ? `${landmarks.length} landmarks` : "No hand detected"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryText: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(34,34,34,0.6)",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
  },
});
