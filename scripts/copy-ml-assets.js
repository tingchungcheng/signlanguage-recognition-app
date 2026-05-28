const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcModel = path.join(root, "ML", "artifacts", "asl_baseline.tflite");
const srcLabels = path.join(root, "ML", "artifacts", "labels.txt");
const destDir = path.join(root, "App", "assets");

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

for (const [src, name] of [
  [srcModel, "asl_baseline.tflite"],
  [srcLabels, "labels.txt"],
]) {
  if (!fs.existsSync(src)) {
    console.error(`Missing ${src}. Train the model first.`);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(destDir, name));
  console.log(`Copied ${name} -> App/assets/`);
}
