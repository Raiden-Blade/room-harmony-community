@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev\stop-demo.ps1" %*
set "RHC_EXIT=%ERRORLEVEL%"
if not "%RHC_EXIT%"=="0" pause
exit /b %RHC_EXIT%
