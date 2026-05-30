/**
 * Safe Android cache wipe for RN New Architecture.
 * Do NOT use `gradlew clean` — it breaks CMake when codegen/jni is already deleted.
 *
 * Stop Metro / `npm run android:dev` first if you see EPERM on .cxx (Gradle locks it).
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const dirs = [
  path.join(root, "android", "app", ".cxx"),
  path.join(root, "android", "app", "build"),
  path.join(root, "android", "build"),
  path.join(root, "android", ".gradle"),
  path.join(root, "node_modules", "react-native-nitro-modules", "android", "build"),
  path.join(root, "node_modules", "react-native-worklets-core", "android", "build"),
  path.join(root, "node_modules", "vision-camera-resize-plugin", "android", "build"),
  path.join(root, "node_modules", "react-native-fast-tflite", "android", "build"),
];

function stopGradleDaemons() {
  const gradlew = path.join(root, "android", process.platform === "win32" ? "gradlew.bat" : "gradlew");
  if (!fs.existsSync(gradlew)) {
    return;
  }
  try {
    execSync(`"${gradlew}" --stop`, { cwd: path.join(root, "android"), stdio: "ignore" });
    console.log("Stopped Gradle daemons.");
  } catch {
    // ignore — daemon may not be running
  }
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* spin */
  }
}

function rm(dir, retries = 4) {
  if (!fs.existsSync(dir)) {
    return true;
  }
  const rel = path.relative(root, dir);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      console.log(`Removed ${rel}`);
      return true;
    } catch (err) {
      const locked = err && (err.code === "EPERM" || err.code === "EBUSY");
      if (!locked || attempt === retries) {
        console.warn(`Could not remove ${rel}: ${err.code ?? err.message}`);
        if (locked) {
          console.warn("  → Stop `npm run android:dev` / Android Studio, then run this script again.");
        }
        return false;
      }
      sleep(400 * attempt);
    }
  }
  return false;
}

stopGradleDaemons();
sleep(500);

const failed = [];
for (const dir of dirs) {
  if (!rm(dir)) {
    failed.push(path.relative(root, dir));
  }
}

if (failed.length === 0) {
  console.log("Android cache cleared. Run: npm run android:dev");
  process.exit(0);
}

console.warn("\nSome folders are still locked:");
for (const f of failed) {
  console.warn(`  - ${f}`);
}
console.warn("\n1. Press Ctrl+C in any terminal running android:dev or Metro");
console.warn("2. Run: npm run android:clean-cache");
console.warn("3. Then: npm run android:dev");
process.exit(1);
