const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

async function generateIcons() {
  const sizes = [192, 512];
  const svgPath = path.join(__dirname, "..", "public", "icons", "icon.svg");

  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // Fill background with gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#9333EA");
    gradient.addColorStop(1, "#EC4899");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.125);
    ctx.fill();

    // Draw emoji text
    ctx.fillStyle = "white";
    ctx.font = `${size * 0.55}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧶", size / 2, size / 2 + size * 0.03);

    const outPath = path.join(__dirname, "..", "public", "icons", `icon-${size}x${size}.png`);
    const buf = canvas.toBuffer("image/png");
    fs.writeFileSync(outPath, buf);
    console.log(`Created ${outPath}`);
  }
}

generateIcons().catch(console.error);