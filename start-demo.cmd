@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\dev\start-demo.ps1" %*
set "RHC_EXIT=%ERRORLEVEL%"
if not "%RHC_EXIT%"=="0" (
  echo.
  echo Room Harmony Community could not start. Review the message above.
  pause
)
exit /b %RHC_EXIT%
