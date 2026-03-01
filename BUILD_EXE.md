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

The executable will be created in the `executable/` folder as:
- `orchestx-server.exe` (Windows x64)

## Running the Executable

1. Copy `orchestx-server.exe` to your desired location
2. Copy `settings.ini` to the same directory (or let it be created with defaults)
3. Run the executable:
```bash
orchestx-server.exe
```

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
