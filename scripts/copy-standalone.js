const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", ".next", "standalone");
const dst = path.join(__dirname, "..", "server");

function copyRecursive(s, d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
    const sp = path.join(s, entry.name);
    const dp = path.join(d, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(sp, dp);
    } else if (entry.isFile()) {
      fs.copyFileSync(sp, dp);
    }
  }
}

// Clean old server dir
if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true });
copyRecursive(src, dst);

// Copy public directory
const publicSrc = path.join(__dirname, "..", "public");
const publicDst = path.join(dst, "public");
if (fs.existsSync(publicSrc)) {
  copyRecursive(publicSrc, publicDst);
}

// Copy data directory
const dataSrc = path.join(__dirname, "..", "data");
const dataDst = path.join(dst, "data");
if (fs.existsSync(dataSrc)) {
  copyRecursive(dataSrc, dataDst);
}

// Rename server.js to standalone.js
const oldServer = path.join(dst, "server.js");
const newServer = path.join(__dirname, "..", "server", "standalone.js");
if (fs.existsSync(oldServer)) {
  const dir = path.dirname(newServer);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(oldServer, newServer);
}

console.log("Standalone build copied to server/ directory");