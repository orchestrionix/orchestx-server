' Launches orchestx-server.exe with no visible console window.
' Place this .vbs in the same folder as orchestx-server.exe (or in Startup with the exe path set below).
Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
exePath = scriptDir & "\orchestx-server.exe"
WshShell.Run """" & exePath & """", 0, False
