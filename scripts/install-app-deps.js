// scripts/install-app-deps.js
const { execSync } = require("node:child_process");

const env = { ...process.env };

// On macOS, point node-gyp to Python 3.11 (Homebrew path). On Windows/Linux, do nothing.
if (process.platform === "darwin" && !env.PYTHON) {
  env.PYTHON = "/opt/homebrew/opt/python@3.11/bin/python3";
}

execSync("electron-builder install-app-deps", {
  stdio: "inherit",
  env,
});
