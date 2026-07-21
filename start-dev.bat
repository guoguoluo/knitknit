@echo off
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
start /B /WAIT "" F:\Node\npm.cmd run dev > "%SCRIPT_DIR%..\server.log" 2>&1
