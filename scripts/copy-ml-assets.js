const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const destDir = path.join(root, "App", "assets");

// hand_landmarker.task is not produced by training — commit App/assets/hand_landmarker.task in git.
const copies = [
  { src: path.join(root, "ML", "artifacts", "asl_baseline.tflite"), name: "asl_baseline.tflite" },
  { src: path.join(root, "ML", "artifacts", "labels.txt"), name: "labels.txt" },
];

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

let copied = 0;
let skipped = 0;

for (const { src, name } of copies) {
  const dest = path.join(destDir, name);
  if (!fs.existsSync(src)) {
    if (fs.existsSync(dest)) {
      console.log(`Skip ${name} (using App/assets from git; no ML/artifacts/)`);
      skipped += 1;
      continue;
    }
    console.error(`Missing ${src} and ${dest}. Train the model or pull App/assets from git.`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied ${name} -> App/assets/`);
  copied += 1;
}

if (copied === 0 && skipped > 0) {
  console.log("App assets OK — no copy needed.");
}
