/**
 * Patches a Windows .exe to use the GUI subsystem (no console window).
 * PE Optional Header: Subsystem at offset 68 (PE32) or 84 (PE32+).
 * 2 = IMAGE_SUBSYSTEM_WINDOWS_GUI, 3 = IMAGE_SUBSYSTEM_WINDOWS_CUI (console).
 */
const fs = require('fs');
const path = require('path');

const IMAGE_SUBSYSTEM_WINDOWS_GUI = 2;
const IMAGE_SUBSYSTEM_WINDOWS_CUI = 3;

function setWindowsSubsystem(exePath) {
  const buf = fs.readFileSync(exePath);
  const dosHeader = buf;
  if (dosHeader.readUInt16LE(0) !== 0x5a4d) {
    throw new Error('Not a valid PE file (missing MZ signature)');
  }
  const e_lfanew = dosHeader.readUInt32LE(0x3c);
  if (buf.readUInt32LE(e_lfanew) !== 0x00004550) {
    throw new Error('Invalid PE signature');
  }
  const optionalHeaderOffset = e_lfanew + 4 + 20;
  const magic = buf.readUInt16LE(optionalHeaderOffset);
  const subsystemOffset = magic === 0x20b
    ? optionalHeaderOffset + 84
    : optionalHeaderOffset + 68;
  const current = buf.readUInt16LE(subsystemOffset);
  if (current !== IMAGE_SUBSYSTEM_WINDOWS_CUI && current !== IMAGE_SUBSYSTEM_WINDOWS_GUI) {
    console.warn(`Unexpected subsystem value ${current}, patching anyway`);
  }
  if (current === IMAGE_SUBSYSTEM_WINDOWS_GUI) {
    console.log('Subsystem already GUI, no change');
    return;
  }
  buf.writeUInt16LE(IMAGE_SUBSYSTEM_WINDOWS_GUI, subsystemOffset);
  fs.writeFileSync(exePath, buf);
  console.log('Patched executable to Windows GUI subsystem (no console window).');
}

const exePath = path.join(__dirname, '..', 'executable', 'orchestx-server.exe');
if (!fs.existsSync(exePath)) {
  console.error('Executable not found:', exePath);
  process.exit(1);
}
setWindowsSubsystem(exePath);
