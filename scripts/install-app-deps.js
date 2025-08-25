import { execSync } from "node:child_process";

const env = { ...process.env };

// macOS only: point node-gyp to Homebrew's Python 3.11 (fixes distutils removal in 3.12+)
if (process.platform === "darwin" && !env.PYTHON) {
  env.PYTHON = "/opt/homebrew/opt/python@3.11/bin/python3";
}

execSync("electron-builder install-app-deps", {
  stdio: "inherit",
  env,
});
