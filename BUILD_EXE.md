# Building Executable with PKG

This guide explains how to build a standalone executable for OrchestX Server.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code and copy React builds:
```bash
npm run build
```

## Building the Executable

Run the build command:
```bash
npm run build:exe
```

This will:
1. Compile TypeScript to JavaScript
2. Copy React build folders (build and qr-build)
3. Package everything into a single executable
4. Copy `run_hidden.vbs` into the `executable/` folder

The executable folder will contain:
- `orchestx-server.exe` (Windows x64)
- `run_hidden.vbs` (launcher that runs the exe with no console window)

## Running the Executable

**Option A – With console window (for debugging)**  
Double‑click `orchestx-server.exe` or run it from a command prompt.

**Option B – No console window (recommended)**  
1. Copy both `orchestx-server.exe` and `run_hidden.vbs` to your desired folder (e.g. `C:\DECAP Virtual Orchestration\`).
2. Copy `settings.ini` to the same directory (or let it be created with defaults).
3. Run `run_hidden.vbs` (double‑click or start it from Startup). The server runs with no visible console.

To start automatically at login: press **Win + R**, type `shell:startup`, put a shortcut to `run_hidden.vbs` in that folder (or copy the .vbs there and ensure `orchestx-server.exe` is in the same folder as the .vbs).

## Important Notes

- **settings.ini**: The executable will look for `settings.ini` in the same directory where it's run. If it doesn't exist, it will use default settings and create the file on first run.
- **Ports**: The executable will use ports 4000 (main app) and 4001 (QR app) by default
- **Build folders**: The React apps (build and qr-build) are bundled inside the executable
- **Node.js**: No need to install Node.js separately - it's bundled in the executable

## Building for Other Platforms

To build for other platforms, modify the `targets` array in `package.json`:

```json
"targets": [
  "node18-win-x64",    // Windows 64-bit
  "node18-linux-x64",   // Linux 64-bit
  "node18-macos-x64"    // macOS 64-bit
]
```

Then run `npm run build:exe` again.
