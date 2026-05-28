import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider } from "./src/state/AppStateContext";
import { HandTrackingScreen } from "./src/screens/HandTrackingScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="light" />
        <HandTrackingScreen />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
