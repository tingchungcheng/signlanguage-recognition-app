/**
 * MediaPipe 0.10.21 omits x86_64 JNI libs (emulator crash:
 * libmediapipe_tasks_vision_jni.so not found). Pin a newer tasks-vision.
 */
const { withAppBuildGradle } = require("expo/config-plugins");

const MEDIAPIPE_TASKS_VISION = "0.10.29";

function withMediapipeAndroidFix(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;

    if (gradle.includes("com.google.mediapipe:tasks-vision")) {
      gradle = gradle.replace(
        /com\.google\.mediapipe:tasks-vision:[\d.]+/g,
        `com.google.mediapipe:tasks-vision:${MEDIAPIPE_TASKS_VISION}`,
      );
    } else {
      gradle = gradle.replace(
        /dependencies\s*\{/,
        `dependencies {\n    // MediaPipe Tasks Vision (x86_64 + 16KB page size)\n    implementation("com.google.mediapipe:tasks-vision:${MEDIAPIPE_TASKS_VISION}")`,
      );
    }

    mod.modResults.contents = gradle;
    return mod;
  });
}

module.exports = withMediapipeAndroidFix;
